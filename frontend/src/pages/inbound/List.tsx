import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Select, DatePicker, Space, InputNumber, Popconfirm } from 'antd';
import { PlusOutlined, EyeOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { inboundApi, warehouseApi, productApi } from '../../services/api';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { TextArea } = Input;

interface InboundItem {
  id?: string;
  productId: string;
  locationId?: string;
  expectedQty: number;
  receivedQty?: number;
  unitPrice?: number;
  batchNo?: string;
  expiryDate?: string;
  remark?: string;
  product?: { name: string; sku: string };
  location?: { name: string; code: string };
}

interface InboundOrder {
  id: string;
  orderNo: string;
  warehouseId: string;
  warehouse?: { name: string };
  type: string;
  status: string;
  createdAt: string;
  items?: InboundItem[];
}

export default function InboundList() {
  const [data, setData] = useState<InboundOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [completeVisible, setCompleteVisible] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<InboundOrder | null>(null);
  const [completeForm] = Form.useForm();
  const [form] = Form.useForm();
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string }>>([]);
  const [products, setProducts] = useState<Array<{ id: string; name: string; sku: string }>>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [locationOptions, setLocationOptions] = useState<Array<{ id: string; name: string; code: string }>>([]);

  // 加载仓库列表
  const loadWarehouses = async () => {
    try {
      const response = await warehouseApi.list({ page: 1, pageSize: 1000 });
      setWarehouses((response.data || []).map((w: any) => ({ id: w.id, name: w.name })));
    } catch (error: any) {
      console.error('加载仓库列表失败:', error);
    }
  };

  // 加载商品列表
  const loadProducts = async () => {
    try {
      const response = await productApi.list({ page: 1, pageSize: 1000 });
      setProducts((response.data || []).map((p: any) => ({ id: p.id, name: p.name, sku: p.sku })));
    } catch (error: any) {
      console.error('加载商品列表失败:', error);
    }
  };

  const loadLocations = async (warehouseId: string) => {
    if (!warehouseId) {
      setLocationOptions([]);
      return;
    }
    try {
      const response = await warehouseApi.listLocations(warehouseId, { page: 1, pageSize: 1000 });
      setLocationOptions(
        (response.data || []).map((loc: any) => ({ id: loc.id, name: loc.name, code: loc.code }))
      );
    } catch (error: any) {
      console.error('加载库位失败:', error);
    }
  };

  // 加载入库单列表
  const loadData = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const response = await inboundApi.list({ page, pageSize });
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
    loadWarehouses();
    loadProducts();
  }, []);

  // 新建入库单
  const handleSubmit = async (values: any) => {
    try {
      const items = (values.items || []).map((item: any) => ({
        productId: item.productId,
        locationId: item.locationId,
        expectedQty: Number(item.expectedQty),
        unitPrice: item.unitPrice ? Number(item.unitPrice) : undefined,
        batchNo: item.batchNo,
        expiryDate: item.expiryDate ? dayjs(item.expiryDate).toISOString() : undefined,
        remark: item.remark,
      }));

      await inboundApi.create({
        warehouseId: values.warehouseId,
        type: values.type,
        orderRef: values.orderRef,
        expectedDate: values.expectedDate ? dayjs(values.expectedDate).toISOString() : undefined,
        items,
        remark: values.remark,
      });

      message.success('创建成功');
      setModalVisible(false);
      form.resetFields();
      loadData(pagination.current, pagination.pageSize);
    } catch (error: any) {
      message.error(error.message || '创建失败');
    }
  };

  // 查看详情
  const handleViewDetail = async (id: string) => {
    try {
      const order = await inboundApi.getById(id);
      setCurrentOrder(order);
      setDetailVisible(true);
    } catch (error: any) {
      message.error(error.message || '加载详情失败');
    }
  };

  // 审核入库单
  const handleApprove = async (id: string) => {
    try {
      await inboundApi.approve(id);
      message.success('审核成功');
      loadData(pagination.current, pagination.pageSize);
    } catch (error: any) {
      message.error(error.message || '审核失败');
    }
  };

  // 打开完成入库表单
  const handleOpenComplete = async (id: string) => {
    try {
      const order = await inboundApi.getById(id);
      setCurrentOrder(order);
      
      // 加载该仓库的库位
      if (order.warehouseId) {
        await loadLocations(order.warehouseId);
      }
      
      // 初始化表单数据
      const initialValues = {
        items: (order.items || []).map((item: any) => ({
          id: item.id,
          productId: item.productId,
          receivedQty: item.expectedQty, // 默认等于预期数量
          locationId: item.locationId,
        })),
      };
      
      completeForm.setFieldsValue(initialValues);
      setCompleteVisible(true);
    } catch (error: any) {
      message.error(error.message || '加载数据失败');
    }
  };

  // 完成入库
  const handleComplete = async (values: any) => {
    try {
      if (!currentOrder) return;
      
      const items = (values.items || []).map((item: any) => ({
        id: item.id,
        productId: item.productId,
        receivedQty: Number(item.receivedQty),
        locationId: item.locationId || undefined,
      }));

      await inboundApi.complete(currentOrder.id, { items });
      message.success('入库完成');
      setCompleteVisible(false);
      completeForm.resetFields();
      setCurrentOrder(null);
      loadData(pagination.current, pagination.pageSize);
    } catch (error: any) {
      message.error(error.message || '完成入库失败');
    }
  };

  // 打开新建表单
  const handleNew = () => {
    form.resetFields();
    form.setFieldValue('items', []);
    setLocationOptions([]);
    setModalVisible(true);
  };

  // 表格列定义
  const columns: ColumnsType<InboundOrder> = [
    { title: '入库单号', dataIndex: 'orderNo', key: 'orderNo', width: 180 },
    {
      title: '仓库',
      key: 'warehouse',
      width: 150,
      render: (_, record) => record.warehouse?.name || record.warehouseId,
    },
    { title: '类型', dataIndex: 'type', key: 'type', width: 120 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusMap: Record<string, { text: string; color: string }> = {
          PENDING: { text: '待审核', color: 'orange' },
          APPROVED: { text: '已审核', color: 'blue' },
          COMPLETED: { text: '已完成', color: 'green' },
          CANCELLED: { text: '已取消', color: 'red' },
        };
        const statusInfo = statusMap[status] || { text: status, color: 'default' };
        return <span style={{ color: statusInfo.color }}>{statusInfo.text}</span>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text) => (text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : ''),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record.id)}>
            详情
          </Button>
          {record.status === 'PENDING' && (
            <Popconfirm
              title="确定要审核这个入库单吗？"
              onConfirm={() => handleApprove(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" icon={<CheckOutlined />}>
                审核
              </Button>
            </Popconfirm>
          )}
          {(record.status === 'APPROVED' || record.status === 'IN_PROGRESS') && (
            <Button type="link" icon={<CheckOutlined />} onClick={() => handleOpenComplete(record.id)}>
              完成入库
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>入库管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleNew}>
          新建入库单
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

      {/* 新建表单 */}
      <Modal
        title="新建入库单"
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        okText="确定"
        cancelText="取消"
        width={1000}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="仓库"
            name="warehouseId"
            rules={[{ required: true, message: '请选择仓库' }]}
          >
            <Select
              placeholder="请选择仓库"
              onChange={(value: string) => {
                loadLocations(value);
                // 每次切换仓库时清空已选库位
                const items = form.getFieldValue('items') || [];
                form.setFieldsValue({
                  items: items.map((item: any) => ({ ...item, locationId: undefined })),
                });
              }}
            >
              {warehouses.map((w) => (
                <Select.Option key={w.id} value={w.id}>
                  {w.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="类型"
            name="type"
            rules={[{ required: true, message: '请选择类型' }]}
          >
            <Select placeholder="请选择类型">
              <Select.Option value="PURCHASE">采购入库</Select.Option>
              <Select.Option value="RETURN">退货入库</Select.Option>
              <Select.Option value="TRANSFER">调拨入库</Select.Option>
              <Select.Option value="ADJUST">调整入库</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="订单参考号" name="orderRef">
            <Input placeholder="请输入订单参考号" />
          </Form.Item>
          <Form.Item label="预计到货日期" name="expectedDate">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <TextArea rows={2} placeholder="请输入备注" />
          </Form.Item>

          {/* 商品列表 */}
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <strong>商品明细</strong>
                  <Button type="dashed" onClick={() => add()}>
                    添加商品
                  </Button>
                </div>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'productId']}
                      rules={[{ required: true, message: '请选择商品' }]}
                    >
                      <Select placeholder="选择商品" style={{ width: 200 }}>
                        {products.map((p) => (
                          <Select.Option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'expectedQty']}
                      rules={[{ required: true, message: '请输入数量' }]}
                    >
                      <InputNumber placeholder="数量" min={0} style={{ width: 120 }} />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'locationId']}>
                      <Select placeholder="选择库位" style={{ width: 180 }} allowClear>
                        {locationOptions.map((loc) => (
                          <Select.Option key={loc.id} value={loc.id}>
                            {loc.name} ({loc.code})
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'unitPrice']}>
                      <InputNumber placeholder="单价" min={0} style={{ width: 120 }} />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'batchNo']}>
                      <Input placeholder="批次号" style={{ width: 120 }} />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'expiryDate']}>
                      <DatePicker placeholder="过期日期" style={{ width: 150 }} />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'remark']}>
                      <Input placeholder="备注" style={{ width: 150 }} />
                    </Form.Item>
                    <Button type="link" danger onClick={() => remove(name)}>
                      删除
                    </Button>
                  </Space>
                ))}
                {fields.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#999', padding: '20px 0' }}>
                    暂无商品，请点击"添加商品"按钮添加
                  </div>
                )}
              </>
            )}
          </Form.List>
        </Form>
      </Modal>

      {/* 详情查看 */}
      <Modal
        title="入库单详情"
        open={detailVisible}
        onCancel={() => {
          setDetailVisible(false);
          setCurrentOrder(null);
        }}
        footer={null}
        width={800}
      >
        {currentOrder && (
          <div>
            <p><strong>入库单号：</strong>{currentOrder.orderNo}</p>
            <p><strong>状态：</strong>{currentOrder.status}</p>
            <p><strong>类型：</strong>{currentOrder.type}</p>
            <p><strong>创建时间：</strong>{dayjs(currentOrder.createdAt).format('YYYY-MM-DD HH:mm:ss')}</p>
            <Table
              dataSource={currentOrder.items || []}
              rowKey={(record: any, index) => record.id || index?.toString() || ''}
              columns={[
                { title: 'SKU', dataIndex: ['product', 'sku'], key: 'sku' },
                { title: '商品名称', dataIndex: ['product', 'name'], key: 'name' },
                {
                  title: '库位',
                  key: 'location',
                  render: (_: any, record: any) =>
                    record.location ? `${record.location.name} (${record.location.code})` : '-',
                },
                { title: '预期数量', dataIndex: 'expectedQty', key: 'expectedQty' },
                { title: '已收数量', dataIndex: 'receivedQty', key: 'receivedQty', render: (val: any) => val || 0 },
                { title: '单价', dataIndex: 'unitPrice', key: 'unitPrice' },
                { title: '批次号', dataIndex: 'batchNo', key: 'batchNo' },
              ]}
              pagination={false}
              size="small"
            />
          </div>
        )}
      </Modal>

      {/* 完成入库表单 */}
      <Modal
        title="完成入库"
        open={completeVisible}
        onOk={() => completeForm.submit()}
        onCancel={() => {
          setCompleteVisible(false);
          completeForm.resetFields();
          setCurrentOrder(null);
        }}
        okText="确定"
        cancelText="取消"
        width={900}
      >
        {currentOrder && (
          <Form form={completeForm} layout="vertical" onFinish={handleComplete}>
            <Form.List name="items">
              {(fields) => (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <strong>请确认实际入库数量和库位：</strong>
                  </div>
                  {fields.map(({ key, name, ...restField }) => {
                    const item = currentOrder.items?.[name];
                    return (
                      <div key={key} style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                        <div style={{ marginBottom: 8 }}>
                          <strong>
                            {item?.product?.name} ({item?.product?.sku})
                          </strong>
                          <span style={{ marginLeft: 16, color: '#666' }}>
                            预期数量: {item?.expectedQty}
                          </span>
                        </div>
                        <Space size="middle" style={{ width: '100%' }}>
                          <Form.Item
                            {...restField}
                            name={[name, 'receivedQty']}
                            label="实际入库数量"
                            rules={[{ required: true, message: '请输入实际入库数量' }]}
                            style={{ marginBottom: 0 }}
                          >
                            <InputNumber
                              placeholder="实际入库数量"
                              min={0}
                              max={item?.expectedQty ? item.expectedQty * 2 : undefined}
                              style={{ width: 150 }}
                            />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'locationId']}
                            label="库位"
                            style={{ marginBottom: 0 }}
                          >
                            <Select placeholder="选择库位" style={{ width: 200 }} allowClear>
                              {locationOptions.map((loc) => (
                                <Select.Option key={loc.id} value={loc.id}>
                                  {loc.name} ({loc.code})
                                </Select.Option>
                              ))}
                            </Select>
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'id']}
                            hidden
                          >
                            <Input />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'productId']}
                            hidden
                          >
                            <Input />
                          </Form.Item>
                        </Space>
                      </div>
                    );
                  })}
                </>
              )}
            </Form.List>
          </Form>
        )}
      </Modal>
    </div>
  );
}
