import { useLanguage } from '@/contexts/LanguageContext';
import {
  Home,
  Store,
  Package,
  Database,
  Headset,
  ShoppingCart,
  BarChart3,
  Users,
  Settings,
  Plus,
  List,
  Archive,
  TrendingUp,
  MessageCircle,
  FileText
} from 'lucide-react';

export const useMenuItems = () => {
  const { t } = useLanguage();

  return [
    {
      icon: Home,
      label: t('home') || 'Ana Sayfa',
      path: '/home',
    },
    {
      icon: Store,
      label: t('stores') || 'Mağazalar',
      path: '/stores',
      subItems: [
        {
          icon: List,
          label: t('storeList') || 'Mağaza Listesi',
          path: '/stores/list',
        },
        {
          icon: Settings,
          label: t('storeSettings') || 'Mağaza Ayarları',
          path: '/stores/settings',
        }
      ]
    },
    {
      icon: Package,
      label: t('products') || 'Ürünler',
      path: '/products',
      subItems: [
        {
          icon: Plus,
          label: t('addProduct') || 'Ürün Ekle',
          path: '/products/add',
        },
        {
          icon: List,
          label: t('productList') || 'Ürün Listesi',
          path: '/products/list',
        },
        {
          icon: Archive,
          label: t('categories') || 'Kategoriler',
          path: '/products/categories',
        }
      ]
    },
    {
      icon: Database,
      label: t('stock') || 'Stok',
      path: '/stock',
      subItems: [
        {
          icon: BarChart3,
          label: t('stockReport') || 'Stok Raporu',
          path: '/stock/report',
        },
        {
          icon: TrendingUp,
          label: t('stockMovement') || 'Stok Hareketi',
          path: '/stock/movement',
        },
        {
          icon: Settings,
          label: t('stockSettings') || 'Stok Ayarları',
          path: '/stock/settings',
        }
      ]
    },
    {
      icon: Headset,
      label: t('support') || 'Destek',
      path: '/help',
      subItems: [
        {
          icon: MessageCircle,
          label: t('tickets') || 'Destek Talepleri',
          path: '/help/tickets',
        },
        {
          icon: FileText,
          label: t('documentation') || 'Dokümantasyon',
          path: '/help/docs',
        }
      ]
    }
  ];
};
