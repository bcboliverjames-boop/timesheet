import { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Popconfirm, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { productApi } from '../../services/api';
import type { ColumnsType } from 'antd/es/table';

interface Product {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  category?: string;
  unit: string;
  specs?: string;
  image?: string;
  status: string;
  createdAt: string;
}

export default function ProductList() {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
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
      const response = await productApi.list({ page, pageSize });
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
      if (editingProduct) {
        await productApi.update(editingProduct.id, values);
        message.success('更新成功');
      } else {
        await productApi.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      form.resetFields();
      setEditingProduct(null);
      loadData(pagination.current, pagination.pageSize);
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  // 编辑
  const handleEdit = (record: Product) => {
    setEditingProduct(record);
    form.setFieldsValue({
      sku: record.sku,
      barcode: record.barcode,
      name: record.name,
      description: record.description,
      category: record.category,
      unit: record.unit || '件',
      specs: record.specs,
      image: record.image,
    });
    setModalVisible(true);
  };

  // 删除
  const handleDelete = async (id: string) => {
    try {
      await productApi.delete(id);
      message.success('删除成功');
      loadData(pagination.current, pagination.pageSize);
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  // 打开新建表单
  const handleNew = () => {
    setEditingProduct(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 取消
  const handleCancel = () => {
    setModalVisible(false);
    form.resetFields();
    setEditingProduct(null);
  };

  // 表格列定义
  const columns: ColumnsType<Product> = [
    { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 150 },
    { title: '条形码', dataIndex: 'barcode', key: 'barcode', width: 150 },
    { title: '商品名称', dataIndex: 'name', key: 'name', width: 200 },
    { title: '类别', dataIndex: 'category', key: 'category', width: 120 },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 80 },
    { title: '规格', dataIndex: 'specs', key: 'specs', width: 150 },
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
            title="确定要删除这个商品吗？"
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
        <h1 style={{ margin: 0 }}>商品管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleNew}>
          新建商品
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        scroll={{ x: 1200 }}
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
        title={editingProduct ? '编辑商品' : '新建商品'}
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={handleCancel}
        okText="确定"
        cancelText="取消"
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            unit: '件',
          }}
        >
          <Form.Item
            label="SKU"
            name="sku"
            rules={[{ required: true, message: '请输入SKU' }]}
          >
            <Input placeholder="请输入SKU" disabled={!!editingProduct} />
          </Form.Item>
          <Form.Item
            label="条形码"
            name="barcode"
          >
            <Input placeholder="请输入条形码" />
          </Form.Item>
          <Form.Item
            label="商品名称"
            name="name"
            rules={[{ required: true, message: '请输入商品名称' }]}
          >
            <Input placeholder="请输入商品名称" />
          </Form.Item>
          <Form.Item
            label="类别"
            name="category"
          >
            <Input placeholder="请输入类别" />
          </Form.Item>
          <Form.Item
            label="单位"
            name="unit"
            rules={[{ required: true, message: '请输入单位' }]}
          >
            <Input placeholder="请输入单位（如：件、箱、个等）" />
          </Form.Item>
          <Form.Item
            label="规格"
            name="specs"
          >
            <Input placeholder="请输入规格" />
          </Form.Item>
          <Form.Item
            label="描述"
            name="description"
          >
            <Input.TextArea rows={3} placeholder="请输入商品描述" />
          </Form.Item>
          <Form.Item
            label="图片URL"
            name="image"
          >
            <Input placeholder="请输入图片URL" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
