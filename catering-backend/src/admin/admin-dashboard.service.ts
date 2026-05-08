import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactSubmission } from '../contact/contact-submission.entity';
import { CatererMarketplaceListing } from '../marketplace/caterer-marketplace-listing.entity';
import { CatererReview } from '../marketplace/caterer-review.entity';
import { UserRole } from '../user/user-role.enum';
import { User } from '../user/user.entity';

export type AdminDashboardTimelineDay = {
  date: string;
  signups: number;
  inquiries: number;
  reviews: number;
};

export type AdminDashboardOverview = {
  totals: {
    users: number;
    caterers: number;
    admins: number;
    inquiries: number;
    listedCaterers: number;
    reviews: number;
    draftsListed: number;
  };
  recent: {
    usersLast7Days: number;
    inquiriesLast7Days: number;
    reviewsLast7Days: number;
  };
  /** Rolling daily counts for charts (inclusive range). */
  timeline: {
    days: number;
    rows: AdminDashboardTimelineDay[];
  };
  generatedAt: string;
};

const TIMELINE_DAYS = 14;

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(ContactSubmission)
    private readonly contacts: Repository<ContactSubmission>,
    @InjectRepository(CatererMarketplaceListing)
    private readonly listings: Repository<CatererMarketplaceListing>,
    @InjectRepository(CatererReview)
    private readonly reviews: Repository<CatererReview>,
  ) {}

  private formatLocalYmd(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private rawDayKey(raw: string | Date): string {
    if (typeof raw === 'string') {
      return raw.slice(0, 10);
    }
    return this.formatLocalYmd(new Date(raw));
  }

  /** GROUP BY calendar day on `created_at` / createdAt. */
  private async countsByCreatedDay(repo: Repository<object>, since: Date): Promise<Map<string, number>> {
    const rows = await repo
      .createQueryBuilder('t')
      .select('DATE(t.createdAt)', 'day')
      .addSelect('COUNT(*)', 'cnt')
      .where('t.createdAt >= :since', { since })
      .groupBy('DATE(t.createdAt)')
      .orderBy('day', 'ASC')
      .getRawMany<{ day: string | Date; cnt: string | number }>();

    const map = new Map<string, number>();
    for (const row of rows) {
      map.set(this.rawDayKey(row.day), Number(row.cnt));
    }
    return map;
  }

  private buildTimelineRows(
    days: number,
    start: Date,
    signups: Map<string, number>,
    inquiries: Map<string, number>,
    revs: Map<string, number>,
  ): AdminDashboardTimelineDay[] {
    const rows: AdminDashboardTimelineDay[] = [];
    const cursor = new Date(start);
    cursor.setHours(0, 0, 0, 0);
    for (let i = 0; i < days; i++) {
      const key = this.formatLocalYmd(cursor);
      rows.push({
        date: key,
        signups: signups.get(key) ?? 0,
        inquiries: inquiries.get(key) ?? 0,
        reviews: revs.get(key) ?? 0,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return rows;
  }

  async getOverview(): Promise<AdminDashboardOverview> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const timelineStart = new Date();
    timelineStart.setHours(0, 0, 0, 0);
    timelineStart.setDate(timelineStart.getDate() - (TIMELINE_DAYS - 1));

    const [
      totalUsers,
      totalCaterers,
      totalAdmins,
      totalInquiries,
      totalListedCaterers,
      totalDraftListings,
      totalReviews,
      usersLast7Days,
      inquiriesLast7Days,
      reviewsLast7Days,
      signupsByDay,
      inquiriesByDay,
      reviewsByDay,
    ] = await Promise.all([
      this.users.count(),
      this.users.count({ where: { role: UserRole.CATERER } }),
      this.users.count({ where: { role: UserRole.ADMIN } }),
      this.contacts.count(),
      this.listings.count({ where: { published: true } }),
      this.listings.count({ where: { published: false } }),
      this.reviews.count(),
      this.users
        .createQueryBuilder('u')
        .where('u.createdAt >= :since', { since: sevenDaysAgo })
        .getCount(),
      this.contacts
        .createQueryBuilder('c')
        .where('c.createdAt >= :since', { since: sevenDaysAgo })
        .getCount(),
      this.reviews
        .createQueryBuilder('r')
        .where('r.createdAt >= :since', { since: sevenDaysAgo })
        .getCount(),
      this.countsByCreatedDay(this.users, timelineStart),
      this.countsByCreatedDay(this.contacts, timelineStart),
      this.countsByCreatedDay(this.reviews, timelineStart),
    ]);

    const timelineRows = this.buildTimelineRows(
      TIMELINE_DAYS,
      timelineStart,
      signupsByDay,
      inquiriesByDay,
      reviewsByDay,
    );

    return {
      totals: {
        users: totalUsers,
        caterers: totalCaterers,
        admins: totalAdmins,
        inquiries: totalInquiries,
        listedCaterers: totalListedCaterers,
        reviews: totalReviews,
        draftsListed: totalDraftListings,
      },
      recent: {
        usersLast7Days,
        inquiriesLast7Days,
        reviewsLast7Days,
      },
      timeline: {
        days: TIMELINE_DAYS,
        rows: timelineRows,
      },
      generatedAt: new Date().toISOString(),
    };
  }
}
