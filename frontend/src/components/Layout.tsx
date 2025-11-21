import { ReactNode } from 'react';
import { Layout, Menu, Avatar, Dropdown } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  HomeOutlined,
  ShoppingOutlined,
  InboxOutlined,
  SendOutlined,
  EnvironmentOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';

const { Header, Sider, Content } = Layout;

interface AppLayoutProps {
  children: ReactNode;
}

const menuItems = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '仪表盘',
  },
  {
    key: '/warehouses',
    icon: <HomeOutlined />,
    label: '仓库管理',
  },
  {
    key: '/locations',
    icon: <EnvironmentOutlined />,
    label: '仓位管理',
  },
  {
    key: '/products',
    icon: <ShoppingOutlined />,
    label: '商品管理',
  },
  {
    key: '/inventory',
    icon: <InboxOutlined />,
    label: '库存管理',
  },
  {
    key: '/inbound',
    icon: <SendOutlined />,
    label: '入库管理',
  },
  {
    key: '/outbound',
    icon: <SendOutlined />,
    label: '出库管理',
  },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, tenant, logout } = useAuthStore();

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" collapsible>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <HomeOutlined style={{ fontSize: 24, marginRight: 8 }} />
          <span style={{ fontSize: 18, fontWeight: 'bold' }}>WMS系统</span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 'bold' }}>
            {tenant?.name || 'WMS仓库管理系统'}
          </div>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user?.name || '用户'}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px', padding: '24px', background: '#fff', minHeight: 280 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}

