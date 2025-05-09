// lib/authUtils.ts
export const ROLES = {
  ADMIN: 'admin',      // ผู้จัดการ/เจ้าของกิจการ
  STAFF: 'staff',      // พนักงานขายตั๋ว  
  DRIVER: 'driver',    // พนักงานขับรถ
  STATION: 'station'   // เพิ่ม role สถานี
} as const;

export const PERMISSIONS = {
  // ระบบจำหน่ายตั๋ว
  SELL_TICKET: 'sell_ticket',
  VIEW_DAILY_SALES: 'view_daily_sales',
  
  // ระบบจัดการพนักงาน
  MANAGE_DRIVERS: 'manage_drivers',
  CHECK_IN_DRIVERS: 'check_in_drivers',
  
  // ระบบรายงาน
  VIEW_ALL_REPORTS: 'view_all_reports',
  VIEW_OWN_INCOME: 'view_own_income',
  VIEW_REVENUE_RATIO: 'view_revenue_ratio', // เพิ่มสิทธิ์ดูอัตราส่วนแบ่งรายได้
  
  // การตั้งค่าระบบ
  SYSTEM_SETTINGS: 'system_settings',
  MANAGE_TICKET_PRICE: 'manage_ticket_price',
  MANAGE_REVENUE_RATIO: 'manage_revenue_ratio'
} as const;

export const rolePermissions = {
  [ROLES.ADMIN]: [
    PERMISSIONS.SELL_TICKET,
    PERMISSIONS.VIEW_DAILY_SALES,
    PERMISSIONS.MANAGE_DRIVERS,
    PERMISSIONS.CHECK_IN_DRIVERS,
    PERMISSIONS.VIEW_ALL_REPORTS,
    PERMISSIONS.VIEW_REVENUE_RATIO,
    PERMISSIONS.SYSTEM_SETTINGS,
    PERMISSIONS.MANAGE_TICKET_PRICE,
    PERMISSIONS.MANAGE_REVENUE_RATIO
  ],
  [ROLES.STAFF]: [
    PERMISSIONS.SELL_TICKET,
    PERMISSIONS.VIEW_DAILY_SALES,
    PERMISSIONS.CHECK_IN_DRIVERS,
    PERMISSIONS.VIEW_ALL_REPORTS
  ],
  [ROLES.DRIVER]: [
    PERMISSIONS.VIEW_OWN_INCOME
  ],
  [ROLES.STATION]: [
    PERMISSIONS.VIEW_DAILY_SALES,
    PERMISSIONS.VIEW_ALL_REPORTS,
    PERMISSIONS.VIEW_REVENUE_RATIO
  ]
};

export function hasPermission(userRole: string, permission: string): boolean {
  return rolePermissions[userRole]?.includes(permission) || false;
}