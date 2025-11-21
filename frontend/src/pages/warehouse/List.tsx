import { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { warehouseApi } from '../../services/api';
import type { ColumnsType } from 'antd/es/table';

interface Warehouse {
  id: string;
  code: string;
  name: string;
  address?: string;
  contact?: string;
  phone?: string;
  status: string;
  createdAt: string;
}

export default function WarehouseList() {
  const [data, setData] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // 加载数据
  const loadData = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const response = await warehouseApi.list({ page, pageSize });
      setData(response.data || []);
      setPagination({
        current: response.pagination?.page || page,
        pageSize: response.pagination?.pageSize || pageSize,
        total: response.pagination?.total || 0,
      });
    } catch (error: any) {
      message.error(error.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 新建/编辑
  const handleSubmit = async (values: any) => {
    try {
      if (editingWarehouse) {
        await warehouseApi.update(editingWarehouse.id, values);
        message.success('更新成功');
      } else {
        await warehouseApi.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      form.resetFields();
      setEditingWarehouse(null);
      loadData(pagination.current, pagination.pageSize);
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  // 编辑
  const handleEdit = (record: Warehouse) => {
    setEditingWarehouse(record);
    form.setFieldsValue({
      code: record.code,
      name: record.name,
      address: record.address,
      contact: record.contact,
      phone: record.phone,
    });
    setModalVisible(true);
  };

  // 删除
  const handleDelete = async (id: string) => {
    try {
      await warehouseApi.delete(id);
      message.success('删除成功');
      loadData(pagination.current, pagination.pageSize);
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  // 打开新建表单
  const handleNew = () => {
    setEditingWarehouse(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 取消
  const handleCancel = () => {
    setModalVisible(false);
    form.resetFields();
    setEditingWarehouse(null);
  };

  // 表格列定义
  const columns: ColumnsType<Warehouse> = [
    { title: '仓库编码', dataIndex: 'code', key: 'code', width: 120 },
    { title: '仓库名称', dataIndex: 'name', key: 'name', width: 200 },
    { title: '地址', dataIndex: 'address', key: 'address', width: 200 },
    { title: '联系人', dataIndex: 'contact', key: 'contact', width: 120 },
    { title: '电话', dataIndex: 'phone', key: 'phone', width: 150 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusMap: Record<string, { text: string; color: string }> = {
          ACTIVE: { text: '启用', color: 'green' },
          INACTIVE: { text: '停用', color: 'red' },
        };
        const statusInfo = statusMap[status] || { text: status, color: 'default' };
        return <span style={{ color: statusInfo.color }}>{statusInfo.text}</span>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个仓库吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>仓库管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleNew}>
          新建仓库
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        scroll={{ x: 1000 }}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showTotal: (total) => `共 ${total} 条`,
          showSizeChanger: true,
          showQuickJumper: true,
          onChange: (page, pageSize) => {
            loadData(page, pageSize);
          },
          onShowSizeChange: (current, size) => {
            loadData(1, size);
          },
        }}
      />

      {/* 新建/编辑表单 */}
      <Modal
        title={editingWarehouse ? '编辑仓库' : '新建仓库'}
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={handleCancel}
        okText="确定"
        cancelText="取消"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="仓库编码"
            name="code"
            rules={[{ required: true, message: '请输入仓库编码' }]}
          >
            <Input placeholder="请输入仓库编码" disabled={!!editingWarehouse} />
          </Form.Item>
          <Form.Item
            label="仓库名称"
            name="name"
            rules={[{ required: true, message: '请输入仓库名称' }]}
          >
            <Input placeholder="请输入仓库名称" />
          </Form.Item>
          <Form.Item
            label="地址"
            name="address"
          >
            <Input placeholder="请输入地址" />
          </Form.Item>
          <Form.Item
            label="联系人"
            name="contact"
          >
            <Input placeholder="请输入联系人" />
          </Form.Item>
          <Form.Item
            label="电话"
            name="phone"
          >
            <Input placeholder="请输入电话" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
