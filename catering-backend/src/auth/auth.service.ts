import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomInt, randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import type { JwtPayload } from './jwt-payload.type';
import { MailService } from '../mail/mail.service';
import { mysqlDbNameFromTenantSlug, slugify, subdomainLabelFrom } from '../tenant/slug.util';
import { Tenant } from '../tenant/tenant.entity';
import { MarketplaceService } from '../marketplace/marketplace.service';
import { TenantProvisioningService } from '../tenant-provisioning/tenant-provisioning.service';
import { UserRole } from '../user/user-role.enum';
import { User } from '../user/user.entity';

const BCRYPT_ROUNDS = 12;
const OTP_BCRYPT_ROUNDS = 10;
/** OTP validity (email code). */
const OTP_TTL_MS = 15 * 60 * 1000;

export type TenantSummary = {
  id: string;
  name: string;
  slug: string;
  subdomain: string | null;
};

export type AuthUserView = {
  id: string;
  email: string;
  fullName: string;
  businessName: string | null;
  phoneCountryCode: string | null;
  phoneNumber: string | null;
  role: UserRole;
  emailVerified: boolean;
  tenant: TenantSummary | null;
};

export type RegisterResult = {
  requiresVerification: true;
  email: string;
  subdomain: string | null;
};

export type AuthSuccess = {
  accessToken: string;
  user: AuthUserView;
};

@Injectable()
export class AuthService {
  private readonly log = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
    private readonly provisioning: TenantProvisioningService,
    private readonly marketplace: MarketplaceService,
  ) {}

  serializeAuthUser(user: User): AuthUserView {
    return this.toView(user);
  }

  private tenantSummary(user: User): TenantSummary | null {
    if (user.role !== UserRole.CATERER || !user.tenant) {
      return null;
    }
    return {
      id: user.tenant.id,
      name: user.tenant.name,
      slug: user.tenant.slug,
      subdomain: user.tenant.subdomain,
    };
  }

  private toView(user: User): AuthUserView {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      businessName: user.businessName,
      phoneCountryCode: user.phoneCountryCode,
      phoneNumber: user.phoneNumber,
      role: user.role,
      emailVerified: Boolean(user.emailVerifiedAt),
      tenant: this.tenantSummary(user),
    };
  }

  private readEnv(key: string): string | undefined {
    const normalize = (raw: string) => raw.replace(/\r/g, '').trim();

    const cfg = this.config.get<string | number | boolean>(key);
    if (cfg !== undefined && cfg !== null) {
      const s = normalize(String(cfg));
      if (s !== '') return s;
    }
    const pe = process.env[key];
    if (pe !== undefined) {
      const s = normalize(pe);
      if (s !== '') return s;
    }
    return undefined;
  }

  /** true / 1 / yes / on (case-insensitive). */
  private isEnvTruthy(key: string): boolean {
    const v = this.readEnv(key)?.toLowerCase();
    return v === 'true' || v === '1' || v === 'yes' || v === 'on';
  }

  /** Unset or empty NODE_ENV counts as non-production (local `nest start --watch`). */
  private isNonProduction(): boolean {
    const raw = this.readEnv('NODE_ENV');
    if (raw === undefined) return true;
    const n = raw.toLowerCase();
    return n !== 'production' && n !== 'prod';
  }

  private getDevOtpEmail(): string {
    return (this.readEnv('DEV_OTP_EMAIL') || 'test123@yopmail.com').toLowerCase();
  }

  private getDevOtpCode(): string {
    const raw = this.readEnv('DEV_OTP_CODE') || '123456';
    return raw.replace(/\D/g, '').padStart(6, '0').slice(0, 6);
  }

  /**
   * Shared test OTP for all signups. Off when NODE_ENV is production unless
   * ALLOW_FIXED_OTP_IN_PRODUCTION=true (staging only).
   */
  private isRegistrationFixedOtpMode(): boolean {
    const inSafeEnv = this.isNonProduction() || this.isEnvTruthy('ALLOW_FIXED_OTP_IN_PRODUCTION');
    if (!inSafeEnv) {
      return false;
    }
    return this.isEnvTruthy('REGISTRATION_FIXED_OTP');
  }

  private getRegistrationFixedOtpCode(): string {
    const raw = this.readEnv('REGISTRATION_OTP_CODE') || '123456';
    return raw.replace(/\D/g, '').padStart(6, '0').slice(0, 6);
  }

  private allowDevFixedOtpBypass(): boolean {
    return this.isNonProduction();
  }

  private matchesDevFixedOtp(email: string, code: string): boolean {
    const e = email.trim().toLowerCase();
    const c = code.replace(/\D/g, '').slice(0, 6);
    return e === this.getDevOtpEmail() && c === this.getDevOtpCode();
  }

  private matchesRegistrationFixedOtp(code: string): boolean {
    if (!this.isRegistrationFixedOtpMode()) {
      return false;
    }
    const c = code.replace(/\D/g, '').slice(0, 6);
    return c === this.getRegistrationFixedOtpCode();
  }

  /**
   * Local/staging only: accept REGISTRATION_OTP_CODE or DEV_OTP_CODE without requiring
   * REGISTRATION_FIXED_OTP parsing (fixes CRLF/.env quirks) or matching the stored bcrypt hash.
   */
  private matchesLocalMasterOtp(code: string): boolean {
    if (!this.isNonProduction()) {
      return false;
    }
    if (this.isEnvTruthy('DISABLE_DEV_OTP_BYPASS')) {
      return false;
    }
    const c = code.replace(/\D/g, '').slice(0, 6);
    return c === this.getRegistrationFixedOtpCode() || c === this.getDevOtpCode();
  }

  private plainOtpForUser(user: User): string {
    if (this.isRegistrationFixedOtpMode()) {
      return this.getRegistrationFixedOtpCode();
    }
    if (user.email === this.getDevOtpEmail()) {
      return this.getDevOtpCode();
    }
    return String(randomInt(0, 1_000_000)).padStart(6, '0');
  }

  private async issueEmailOtp(user: User): Promise<string> {
    const plain = this.plainOtpForUser(user);
    user.emailVerificationOtpHash = await bcrypt.hash(plain, OTP_BCRYPT_ROUNDS);
    user.emailVerificationExpiresAt = new Date(Date.now() + OTP_TTL_MS);
    user.emailVerificationToken = null;
    return plain;
  }

  private clearVerificationFields(user: User): void {
    user.emailVerifiedAt = new Date();
    user.emailVerificationToken = null;
    user.emailVerificationExpiresAt = null;
    user.emailVerificationOtpHash = null;
  }

  private async ensureUniqueTenantSlugInManager(
    tenantRepo: Repository<Tenant>,
    baseInput: string,
  ): Promise<string> {
    const base = slugify(baseInput).slice(0, 50) || 'catering';
    let candidate = base;
    for (let i = 0; i < 24; i++) {
      const taken = await tenantRepo.exist({ where: { slug: candidate } });
      if (!taken) {
        return candidate;
      }
      const suffix = randomBytes(3).toString('hex');
      candidate = `${base}-${suffix}`.slice(0, 80);
    }
    return `${base}-${randomUUID().slice(0, 8)}`.slice(0, 80);
  }

  private async ensureUniqueSubdomainInManager(
    tenantRepo: Repository<Tenant>,
    baseInput: string,
  ): Promise<string> {
    const base = subdomainLabelFrom(baseInput) || 'catering';
    let candidate = base;
    for (let i = 0; i < 24; i++) {
      const taken = await tenantRepo.exist({ where: { subdomain: candidate } });
      if (!taken) {
        return candidate;
      }
      const suffix = randomBytes(2).toString('hex');
      candidate = `${base}-${suffix}`.slice(0, 63);
    }
    return `${base}-${randomUUID().slice(0, 8)}`.slice(0, 63);
  }

  private async ensureUniqueDbNameInManager(
    tenantRepo: Repository<Tenant>,
    tenantSlug: string,
  ): Promise<string> {
    const base = mysqlDbNameFromTenantSlug(tenantSlug);
    let candidate = base;
    for (let i = 0; i < 24; i++) {
      const taken = await tenantRepo.exist({ where: { dbName: candidate } });
      if (!taken) {
        return candidate;
      }
      const suffix = `_${randomBytes(2).toString('hex')}`;
      const maxBaseLen = Math.max(1, 64 - suffix.length);
      candidate = `${base.slice(0, maxBaseLen)}${suffix}`;
    }
    return `${base.slice(0, 40)}_${randomUUID().replace(/-/g, '')}`.slice(0, 64);
  }

  async register(dto: RegisterDto): Promise<RegisterResult> {
    const existing = await this.users.findOne({ where: { email: dto.email.toLowerCase() } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }
    const email = dto.email.toLowerCase();
    const fullName = dto.fullName.trim();
    const businessName = dto.businessName.trim();
    let otpPlain = '';
    let responseSubdomain: string | null = null;

    await this.users.manager.transaction(async (em) => {
      const tenantRepo = em.getRepository(Tenant);
      const userRepo = em.getRepository(User);
      const tenantId = randomUUID();
      const slug = await this.ensureUniqueTenantSlugInManager(tenantRepo, businessName);
      const dbName = await this.ensureUniqueDbNameInManager(tenantRepo, slug);
      const subdomain = await this.ensureUniqueSubdomainInManager(tenantRepo, businessName);
      responseSubdomain = subdomain;

      const tenant = tenantRepo.create({
        id: tenantId,
        name: businessName,
        slug,
        subdomain,
        dbName,
        provisionStatus: 'pending',
        profilePublished: false,
        profileOptions: null,
      });
      await tenantRepo.save(tenant);

      const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
      const user = userRepo.create({
        email,
        passwordHash,
        fullName,
        businessName,
        phoneCountryCode: dto.phoneCountryCode,
        phoneNumber: dto.phoneNumber,
        role: UserRole.CATERER,
        emailVerifiedAt: null,
        tenant,
      });
      otpPlain = await this.issueEmailOtp(user);
      await userRepo.save(user);

      const tenantForOwner = await tenantRepo.findOneByOrFail({ id: tenantId });
      tenantForOwner.ownerUser = user;
      await tenantRepo.save(tenantForOwner);
    });

    const saved = await this.users.findOne({ where: { email }, relations: { tenant: true } });
    if (saved?.tenant?.subdomain != null) {
      responseSubdomain = saved.tenant.subdomain;
    }

    try {
      await this.mail.sendCatererOtpEmail(email, {
        fullName,
        businessName,
        subdomain: responseSubdomain,
        otpPlain,
      });
    } catch (e) {
      console.error('[AuthService] OTP email failed', e);
    }
    return { requiresVerification: true, email, subdomain: responseSubdomain };
  }

  /** Creates tenant DB and runs migrations after email is verified (register does not provision). */
  private async provisionTenantAfterEmailVerify(tenantId: string): Promise<void> {
    try {
      await this.provisioning.provisionTenant(tenantId);
    } catch (e) {
      this.log.error(`Tenant DB provision failed after email verify (${tenantId})`, e);
    }
  }

  private async afterCatererEmailVerified(tenantId: string): Promise<void> {
    await this.marketplace.ensureDraftListingForTenant(tenantId);
    await this.provisionTenantAfterEmailVerify(tenantId);
  }

  private async loadUserWithTenant(id: string): Promise<User> {
    const user = await this.users.findOne({
      where: { id },
      relations: { tenant: true },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }

  async verifyOtp(email: string, code: string): Promise<AuthSuccess> {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.replace(/\D/g, '').slice(0, 6);

    const user = await this.users.findOne({
      where: { email: normalizedEmail },
      relations: { tenant: true },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid or expired code');
    }
    if (user.role !== UserRole.CATERER) {
      throw new UnauthorizedException('Invalid or expired code');
    }
    if (user.emailVerifiedAt) {
      throw new ConflictException({
        code: 'EMAIL_ALREADY_VERIFIED',
        message: 'This email is already verified. Sign in with your password.',
      });
    }

    const fixedOtpOk = this.matchesRegistrationFixedOtp(normalizedCode);

    const devOk =
      this.allowDevFixedOtpBypass() &&
      this.matchesDevFixedOtp(normalizedEmail, normalizedCode);

    const localMasterOk = this.matchesLocalMasterOtp(normalizedCode);

    if (fixedOtpOk || devOk || localMasterOk) {
      this.clearVerificationFields(user);
      await this.users.save(user);
      const fresh = await this.loadUserWithTenant(user.id);
      if (fresh.tenant?.id) {
        await this.afterCatererEmailVerified(fresh.tenant.id);
      }
      return { accessToken: await this.signToken(fresh), user: this.toView(fresh) };
    }

    if (!user.emailVerificationOtpHash || !user.emailVerificationExpiresAt) {
      throw new UnauthorizedException(
        'No code on file. Use “Resend code” on the verification page, then try again.',
      );
    }
    if (user.emailVerificationExpiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Code expired. Request a new code and try again.');
    }
    const ok = await bcrypt.compare(normalizedCode, user.emailVerificationOtpHash);
    if (!ok) {
      if (this.isNonProduction()) {
        this.log.debug(
          `OTP mismatch for ${normalizedEmail}; fixedOtpMode=${this.isRegistrationFixedOtpMode()} expectedFixed=${this.getRegistrationFixedOtpCode()} NODE_ENV=${this.readEnv('NODE_ENV') ?? '(unset)'} REGISTRATION_FIXED_OTP=${this.readEnv('REGISTRATION_FIXED_OTP') ?? '(unset)'}`,
        );
      }
      throw new UnauthorizedException('Invalid or expired code');
    }
    this.clearVerificationFields(user);
    await this.users.save(user);
    const fresh = await this.loadUserWithTenant(user.id);
    if (fresh.tenant?.id) {
      await this.afterCatererEmailVerified(fresh.tenant.id);
    }
    const accessToken = await this.signToken(fresh);
    return { accessToken, user: this.toView(fresh) };
  }

  async verifyEmail(token: string): Promise<AuthSuccess> {
    const user = await this.users.findOne({
      where: { emailVerificationToken: token },
      relations: { tenant: true },
    });
    if (!user || !user.emailVerificationExpiresAt) {
      throw new UnauthorizedException('Invalid or expired verification link');
    }
    if (user.emailVerificationExpiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Invalid or expired verification link');
    }
    this.clearVerificationFields(user);
    await this.users.save(user);
    const fresh = await this.loadUserWithTenant(user.id);
    if (fresh.tenant?.id) {
      await this.afterCatererEmailVerified(fresh.tenant.id);
    }
    const accessToken = await this.signToken(fresh);
    return { accessToken, user: this.toView(fresh) };
  }

  async resendVerification(email: string): Promise<{ ok: true }> {
    const user = await this.users.findOne({
      where: { email: email.toLowerCase() },
      relations: { tenant: true },
    });
    if (!user || user.role !== UserRole.CATERER || user.emailVerifiedAt) {
      return { ok: true };
    }
    const otpPlain = await this.issueEmailOtp(user);
    await this.users.save(user);
    try {
      await this.mail.sendCatererOtpEmail(user.email, {
        fullName: user.fullName,
        businessName: user.businessName ?? user.fullName,
        subdomain: user.tenant?.subdomain ?? null,
        otpPlain,
      });
    } catch (e) {
      console.error('[AuthService] Resend OTP failed', e);
    }
    return { ok: true };
  }

  async login(dto: LoginDto): Promise<AuthSuccess> {
    const user = await this.users.findOne({
      where: { email: dto.email.toLowerCase() },
      relations: { tenant: true },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (user.role === UserRole.CATERER && !user.emailVerifiedAt) {
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          code: 'EMAIL_NOT_VERIFIED',
          message:
            'Please verify your email before signing in. Enter the code we sent or request a new one.',
        },
        HttpStatus.FORBIDDEN,
      );
    }
    if (user.role === UserRole.CATERER && user.tenant?.id) {
      await this.provisioning.ensureTenantDataReady(user.tenant.id).catch(() => undefined);
    }
    const accessToken = await this.signToken(user);
    return { accessToken, user: this.toView(user) };
  }

  private signToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      ev: Boolean(user.emailVerifiedAt),
      tid: user.role === UserRole.CATERER ? (user.tenant?.id ?? null) : null,
    };
    return this.jwt.signAsync(payload);
  }
}
