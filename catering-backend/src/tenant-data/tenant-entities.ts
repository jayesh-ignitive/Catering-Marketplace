import { CatererStaff } from './entities/caterer-staff.entity';
import { MenuCategory } from './entities/menu-category.entity';
import { MenuItem } from './entities/menu-item.entity';
import { TenantInvoice } from './entities/tenant-invoice.entity';
import { TenantOrder } from './entities/tenant-order.entity';

export const TENANT_TYPEORM_ENTITIES = [
  MenuCategory,
  MenuItem,
  CatererStaff,
  TenantOrder,
  TenantInvoice,
] as const;
