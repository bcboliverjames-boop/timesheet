import { Card, Row, Col, Statistic } from 'antd';
import { HomeOutlined, ShoppingOutlined, InboxOutlined, WarningOutlined } from '@ant-design/icons';

export default function Dashboard() {
  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>仪表盘</h1>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="仓库数量" value={0} prefix={<HomeOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="商品数量" value={0} prefix={<ShoppingOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="库存总量" value={0} prefix={<InboxOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="库存预警"
              value={0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

