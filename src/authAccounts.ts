import { AuthUser, OwnerRoleId } from './types';

export interface OwnerAccountDefinition {
  username: string;
  email: string;
  password: string;
  name: string;
  nameEn: string;
  role: string;
  roleId: OwnerRoleId;
  roleTitleFa: string;
  roleTitlePs: string;
  roleTitleEn: string;
  phone: string;
  avatarColor: string;
  descriptionFa: string;
  descriptionPs: string;
  descriptionEn: string;
}

export const OWNER_ACCOUNTS: OwnerAccountDefinition[] = [
  {
    username: 'owner1',
    email: 'owner1@makkahfeed.af',
    password: 'MakkahOwner1@786',
    name: 'محترم حاجی صاحب (مالک اول)',
    nameEn: 'Haji Sahib (Partner & Owner 1)',
    role: 'مالک و شریک اصلی کارخانه (Owner 1)',
    roleId: 'owner_one',
    roleTitleFa: 'مالک و شریک اصلی کارخانه',
    roleTitlePs: 'د فابریکې اصلي مالک او شریک',
    roleTitleEn: 'Co-Owner & Executive Partner',
    phone: '0780 001 923',
    avatarColor: 'from-amber-500 to-amber-600',
    descriptionFa: 'مدیریت و ثبت تصفیه طلبات مشتریان، پرداخت به عرضه کنندگان و امور مالی',
    descriptionPs: 'د مشتریانو د پیسو ترلاسه کول او عرضه کوونکو ته تادیه ثبتول',
    descriptionEn: 'Receiving customer balances, disbursing supplier dues, and managing treasury operations',
  },
  {
    username: 'owner2',
    email: 'owner2@makkahfeed.af',
    password: 'MakkahOwner2@786',
    name: 'محترم شریک صاحب (مالک دوم)',
    nameEn: 'Partner Sahib (Partner & Owner 2)',
    role: 'مالک و شریک دوم کارخانه (Owner 2)',
    roleId: 'owner_two',
    roleTitleFa: 'مالک و شریک دوم کارخانه',
    roleTitlePs: 'د فابریکې دویم مالک او شریک',
    roleTitleEn: 'Co-Owner & Managing Partner',
    phone: '0780 001 923',
    avatarColor: 'from-emerald-500 to-emerald-600',
    descriptionFa: 'مدیریت و ثبت تصفیه طلبات مشتریان، پرداخت به عرضه کنندگان و امور مالی',
    descriptionPs: 'د مشتریانو د پیسو ترلاسه کول او عرضه کوونکو ته تادیه ثبتول',
    descriptionEn: 'Receiving customer balances, disbursing supplier dues, and managing treasury operations',
  },
  {
    username: 'rayan',
    email: 'Rayan@poletry.af',
    password: 'Rayan6789',
    name: 'ریان (Rayan)',
    nameEn: 'Eng. Rayan (Director)',
    role: 'مدیر عمومی کارخانه (General Director)',
    roleId: 'admin',
    roleTitleFa: 'مدیر عمومی کارخانه',
    roleTitlePs: 'د فابریکې عمومي مدیر',
    roleTitleEn: 'General Factory Director',
    phone: '0780 001 923',
    avatarColor: 'from-blue-500 to-indigo-600',
    descriptionFa: 'کنترل کامل عملیات، فرمولاسیون، گدام، فروشات و دسترسی جامع مدیریتی',
    descriptionPs: 'د فابریکې بشپړ عملیاتي او مدیریتي واک',
    descriptionEn: 'Full factory administrative, formulation and operational supervision',
  }
];

export const authenticateOwner = (loginInput: string, passwordInput: string): AuthUser | null => {
  const cleanInput = loginInput.trim().toLowerCase();
  const cleanPass = passwordInput.trim();

  const account = OWNER_ACCOUNTS.find(acc => 
    (acc.username.toLowerCase() === cleanInput || acc.email.toLowerCase() === cleanInput) &&
    acc.password === cleanPass
  );

  if (!account) return null;

  return {
    email: account.email,
    username: account.username,
    name: account.name,
    role: account.role,
    roleId: account.roleId,
    phone: account.phone,
    loginTime: new Date().toISOString(),
  };
};
