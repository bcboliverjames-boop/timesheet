import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Popconfirm,
  Empty,
} from 'antd';
import { EnvironmentOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { warehouseApi } from '../../services/api';

interface WarehouseOption {
  id: string;
  name: string;
}

interface LocationItem {
  id: string;
  code: string;
  name: string;
  zone?: string;
  aisle?: string;
  shelf?: string;
  position?: string;
  capacity?: number;
  status: string;
}

const statusOptions = [
  { label: '可用', value: 'AVAILABLE' },
  { label: '占用', value: 'OCCUPIED' },
  { label: '预留', value: 'RESERVED' },
  { label: '维护中', value: 'MAINTENANCE' },
];

export default function LocationList() {
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>();
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationItem | null>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
  });

  // 加载仓库列表
  const loadWarehouses = async () => {
    try {
      const response = await warehouseApi.list({ page: 1, pageSize: 1000 });
      setWarehouses(response.data || []);
      if (!selectedWarehouse && response.data?.length) {
        setSelectedWarehouse(response.data[0].id);
      }
    } catch (error: any) {
      message.error(error.message || '加载仓库列表失败');
    }
  };

  // 加载库位列表
  const loadLocations = async (warehouseId?: string, page = 1, pageSize = 50) => {
    if (!warehouseId) {
      setLocations([]);
      return;
    }
    setLoading(true);
    try {
      const response = await warehouseApi.listLocations(warehouseId, { page, pageSize });
      setLocations(response.data || []);
      setPagination({
        current: response.pagination?.page || page,
        pageSize: response.pagination?.pageSize || pageSize,
        total: response.pagination?.total || 0,
      });
    } catch (error: any) {
      message.error(error.message || '加载库位失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarehouses();
  }, []);

  useEffect(() => {
    loadLocations(selectedWarehouse, pagination.current, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWarehouse]);

  const handleWarehouseChange = (value: string) => {
    setSelectedWarehouse(value);
  };

  const handleSubmit = async (values: any) => {
    if (!selectedWarehouse) {
      message.warning('请先选择仓库');
      return;
    }

    try {
      if (editingLocation) {
        await warehouseApi.updateLocation(editingLocation.id, values);
        message.success('更新成功');
      } else {
        await warehouseApi.createLocation(selectedWarehouse, values);
        message.success('创建成功');
      }
      setModalVisible(false);
      form.resetFields();
      setEditingLocation(null);
      loadLocations(selectedWarehouse, pagination.current, pagination.pageSize);
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const handleEdit = (record: LocationItem) => {
    setEditingLocation(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (record: LocationItem) => {
    try {
      await warehouseApi.deleteLocation(record.id);
      message.success('删除成功');
      loadLocations(selectedWarehouse, pagination.current, pagination.pageSize);
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const columns = [
    { title: '库位编码', dataIndex: 'code', key: 'code', width: 120 },
    { title: '库位名称', dataIndex: 'name', key: 'name', width: 180 },
    { title: '区域', dataIndex: 'zone', key: 'zone', width: 100 },
    { title: '通道', dataIndex: 'aisle', key: 'aisle', width: 100 },
    { title: '货架', dataIndex: 'shelf', key: 'shelf', width: 100 },
    { title: '位置', dataIndex: 'position', key: 'position', width: 100 },
    { title: '容量', dataIndex: 'capacity', key: 'capacity', width: 80 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const map: Record<string, string> = {
          AVAILABLE: '可用',
          OCCUPIED: '占用',
          RESERVED: '预留',
          MAINTENANCE: '维护中',
        };
        return map[status] || status;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: LocationItem) => (
        <Space size="small">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除该库位吗？" onConfirm={() => handleDelete(record)}>
            <Button type="link" icon={<DeleteOutlined />} danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <EnvironmentOutlined />
            仓位管理
          </h1>
          <Select
            placeholder="选择仓库"
            style={{ width: 240 }}
            value={selectedWarehouse}
            onChange={handleWarehouseChange}
            options={warehouses.map((w) => ({ label: w.name, value: w.id }))}
          />
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)} disabled={!selectedWarehouse}>
          新建仓位
        </Button>
      </div>

      {selectedWarehouse ? (
        <Table
          columns={columns}
          dataSource={locations}
          loading={loading}
          rowKey="id"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showTotal: (total) => `共 ${total} 条`,
            showSizeChanger: true,
            onChange: (page, pageSize) => loadLocations(selectedWarehouse, page, pageSize),
            onShowSizeChange: (_current, size) => loadLocations(selectedWarehouse, 1, size),
          }}
          scroll={{ x: 900 }}
        />
      ) : (
        <Empty description="请先选择仓库" />
      )}

      <Modal
        open={modalVisible}
        title={editingLocation ? '编辑仓位' : '新建仓位'}
        onOk={() => form.submit()}
        onCancel={() => {
          setModalVisible(false);
          setEditingLocation(null);
          form.resetFields();
        }}
        destroyOnClose
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="库位编码" name="code" rules={[{ required: true, message: '请输入库位编码' }]}>
            <Input disabled={!!editingLocation} placeholder="请输入库位编码" />
          </Form.Item>
          <Form.Item label="库位名称" name="name" rules={[{ required: true, message: '请输入库位名称' }]}>
            <Input placeholder="请输入库位名称" />
          </Form.Item>
          <Form.Item label="区域" name="zone">
            <Input placeholder="请输入区域" />
          </Form.Item>
          <Form.Item label="通道" name="aisle">
            <Input placeholder="请输入通道" />
          </Form.Item>
          <Form.Item label="货架" name="shelf">
            <Input placeholder="请输入货架" />
          </Form.Item>
          <Form.Item label="位置" name="position">
            <Input placeholder="请输入具体位置" />
          </Form.Item>
          <Form.Item label="容量" name="capacity">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="输入容量（可选）" />
          </Form.Item>
          <Form.Item label="状态" name="status" initialValue="AVAILABLE">
            <Select options={statusOptions} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

