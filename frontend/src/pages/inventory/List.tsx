import { useEffect, useState } from 'react';
import { Table, Select, Input, Button, Space, Tag, Modal, Form, InputNumber, message } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { inventoryApi, warehouseApi, productApi } from '../../services/api';
import type { ColumnsType } from 'antd/es/table';

interface InventoryItem {
  id: string;
  warehouse: { id: string; name: string };
  product: { id: string; name: string; sku: string; unit: string };
  location?: { id: string; name: string; code: string };
  quantity: number;
  availableQty: number;
  reservedQty: number;
  lastUpdated: string;
}

export default function InventoryList() {
  const [data, setData] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [adjustVisible, setAdjustVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState<InventoryItem | null>(null);
  const [adjustForm] = Form.useForm();
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string }>>([]);
  const [products, setProducts] = useState<Array<{ id: string; name: string; sku: string }>>([]);
  const [locations, setLocations] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [filters, setFilters] = useState<{ warehouseId?: string; productId?: string; keyword?: string }>({});
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  const loadWarehouses = async () => {
    const response = await warehouseApi.list({ page: 1, pageSize: 1000 });
    setWarehouses(response.data || []);
  };

  const loadProducts = async () => {
    const response = await productApi.list({ page: 1, pageSize: 1000 });
    setProducts(response.data || []);
  };

  const loadLocations = async (warehouseId: string) => {
    if (!warehouseId) {
      setLocations([]);
      return;
    }
    try {
      const response = await warehouseApi.listLocations(warehouseId, { page: 1, pageSize: 1000 });
      setLocations((response.data || []).map((loc: any) => ({ id: loc.id, name: loc.name, code: loc.code })));
    } catch (error: any) {
      console.error('加载库位失败:', error);
    }
  };

  const loadInventory = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const response = await inventoryApi.list({
        page,
        pageSize,
        warehouseId: filters.warehouseId,
        productId: filters.productId,
        keyword: filters.keyword,
      });
      setData(response.data || []);
      setPagination({
        current: response.pagination?.page || page,
        pageSize: response.pagination?.pageSize || pageSize,
        total: response.pagination?.total || 0,
      });
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarehouses();
    loadProducts();
    loadInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns: ColumnsType<InventoryItem> = [
    {
      title: '仓库',
      dataIndex: ['warehouse', 'name'],
      key: 'warehouse',
    },
    {
      title: '商品',
      key: 'product',
      render: (_, record) => (
        <div>
          <div>{record.product.name}</div>
          <small style={{ color: '#999' }}>{record.product.sku}</small>
        </div>
      ),
    },
    {
      title: '库位',
      key: 'location',
      render: (_, record) =>
        record.location ? (
          <span>
            {record.location.name} <Tag>{record.location.code}</Tag>
          </span>
        ) : (
          '-'
        ),
    },
    { title: '总数量', dataIndex: 'quantity', key: 'quantity' },
    { title: '可用数量', dataIndex: 'availableQty', key: 'availableQty' },
    { title: '预留数量', dataIndex: 'reservedQty', key: 'reservedQty' },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => handleAdjust(record)}
        >
          调整
        </Button>
      ),
    },
  ];

  const handleAdjust = (item: InventoryItem) => {
    setCurrentItem(item);
    adjustForm.setFieldsValue({
      warehouseId: item.warehouse.id,
      productId: item.product.id,
      locationId: item.location?.id,
      quantity: item.quantity,
      reason: '',
      remark: '',
    });
    loadLocations(item.warehouse.id);
    setAdjustVisible(true);
  };

  const handleAdjustSubmit = async (values: any) => {
    try {
      await inventoryApi.adjust({
        warehouseId: values.warehouseId,
        productId: values.productId,
        locationId: values.locationId || undefined,
        quantity: Number(values.quantity),
        reason: values.reason || undefined,
        remark: values.remark || undefined,
      });
      message.success('库存调整成功');
      setAdjustVisible(false);
      adjustForm.resetFields();
      setCurrentItem(null);
      loadInventory(pagination.current, pagination.pageSize);
    } catch (error: any) {
      message.error(error.message || '库存调整失败');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 16 }}>库存管理</h1>
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder="选择仓库"
          allowClear
          style={{ width: 200 }}
          options={warehouses.map((w) => ({ label: w.name, value: w.id }))}
          value={filters.warehouseId}
          onChange={(value) => setFilters((prev) => ({ ...prev, warehouseId: value }))}
        />
        <Select
          placeholder="选择商品"
          allowClear
          showSearch
          filterOption={(input, option) =>
            (option?.label as string).toLowerCase().includes(input.toLowerCase())
          }
          style={{ width: 240 }}
          options={products.map((p) => ({ label: `${p.name} (${p.sku})`, value: p.id }))}
          value={filters.productId}
          onChange={(value) => setFilters((prev) => ({ ...prev, productId: value }))}
        />
        <Input
          placeholder="关键字（商品名称/SKU）"
          style={{ width: 220 }}
          value={filters.keyword}
          onChange={(e) => setFilters((prev) => ({ ...prev, keyword: e.target.value }))}
        />
        <Button type="primary" onClick={() => loadInventory(1, pagination.pageSize)}>
          查询
        </Button>
        <Button
          onClick={() => {
            setFilters({});
            loadInventory(1, pagination.pageSize);
          }}
        >
          重置
        </Button>
      </Space>
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => loadInventory(page, pageSize),
          onShowSizeChange: (_current, size) => loadInventory(1, size),
        }}
        scroll={{ x: 1000 }}
      />

      {/* 库存调整表单 */}
      <Modal
        title="库存调整"
        open={adjustVisible}
        onOk={() => adjustForm.submit()}
        onCancel={() => {
          setAdjustVisible(false);
          adjustForm.resetFields();
          setCurrentItem(null);
        }}
        okText="确定"
        cancelText="取消"
        width={600}
      >
        {currentItem && (
          <Form form={adjustForm} layout="vertical" onFinish={handleAdjustSubmit}>
            <Form.Item label="仓库" name="warehouseId">
              <Select disabled>
                {warehouses.map((w) => (
                  <Select.Option key={w.id} value={w.id}>
                    {w.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="商品" name="productId">
              <Select disabled>
                {products.map((p) => (
                  <Select.Option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="库位" name="locationId">
              <Select placeholder="选择库位（可选）" allowClear onChange={(value) => {
                if (value) {
                  loadLocations(adjustForm.getFieldValue('warehouseId'));
                }
              }}>
                {locations.map((loc) => (
                  <Select.Option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.code})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              label="调整后数量"
              name="quantity"
              rules={[{ required: true, message: '请输入调整后数量' }]}
            >
              <InputNumber placeholder="调整后数量" min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="调整原因" name="reason">
              <Input placeholder="请输入调整原因" />
            </Form.Item>
            <Form.Item label="备注" name="remark">
              <Input.TextArea rows={3} placeholder="请输入备注" />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
}

