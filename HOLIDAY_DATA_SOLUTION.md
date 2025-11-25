# 中国法定节假日数据获取方案

## 问题分析

当前实现方式：硬编码在代码中的 `HOLIDAY_CONFIG` 对象，只包含 2025 年数据。

**存在的问题：**
1. ❌ 每年需要手动更新代码
2. ❌ 容易遗漏或出错
3. ❌ 无法自动获取未来年份数据
4. ❌ 维护成本高，不适合长期运营

## 解决方案对比

### 方案一：使用 GitHub 数据仓库（推荐 ⭐⭐⭐⭐⭐）

**优点：**
- ✅ 数据准确，由社区维护
- ✅ 免费使用
- ✅ 支持多年数据（通常包含历史+未来3-5年）
- ✅ 可通过 CDN 直接加载 JSON
- ✅ 无需后端服务

**推荐数据源：**
1. **NateScarlet/holiday-cn** (GitHub)
   - URL: `https://raw.githubusercontent.com/NateScarlet/holiday-cn/master/holiday-cn.json`
   - 格式：JSON，包含节假日和调休信息
   - 更新频率：每年国务院发布后更新

2. **timor/holiday** (GitHub)
   - URL: `https://raw.githubusercontent.com/timor/holiday/main/data/YYYY.json`
   - 格式：按年份的 JSON 文件
   - 支持多年数据

**实现方式：**
```javascript
// 从 CDN 加载节假日数据
async function loadHolidayData(year) {
  const url = `https://raw.githubusercontent.com/NateScarlet/holiday-cn/master/${year}.json`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    return parseHolidayData(data);
  } catch (error) {
    // 降级到本地缓存
    return getLocalHolidayData(year);
  }
}
```

### 方案二：使用第三方 API（⭐⭐⭐）

**优点：**
- ✅ 数据实时更新
- ✅ 通常包含多年数据
- ✅ 可能有官方数据源

**缺点：**
- ❌ 可能有费用
- ❌ 依赖外部服务
- ❌ 需要处理 API 失效

**推荐 API：**
1. **聚合数据节假日 API**
   - 需要注册，有免费额度
   - URL: `https://www.juhe.cn/docs/api/id/177`

2. **高德地图节假日 API**
   - 需要 API Key
   - 部分免费

### 方案三：混合方案（推荐 ⭐⭐⭐⭐）

**策略：**
1. **本地缓存**：保存最近3年的数据（去年、今年、明年）
2. **动态加载**：优先从 GitHub 加载最新数据
3. **降级方案**：API 失败时使用本地缓存
4. **自动更新**：每年自动检测并更新数据

**实现架构：**
```
用户请求 → 检查本地缓存 → 
  ├─ 有数据且未过期 → 直接使用
  ├─ 无数据或过期 → 从 GitHub 加载 → 更新缓存 → 使用
  └─ 加载失败 → 使用本地缓存（降级）
```

## 推荐实现方案

基于您的需求（纯前端、长期运营），推荐使用 **方案三（混合方案）**：

### 1. 数据源选择
- **主要数据源**：GitHub `NateScarlet/holiday-cn` 仓库
- **备用数据源**：本地缓存最近3年数据

### 2. 数据格式转换
GitHub 数据格式示例：
```json
{
  "2025": {
    "2025-01-01": { "isOffDay": true, "name": "元旦" },
    "2025-01-26": { "isOffDay": false, "name": "春节调休补班" },
    "2025-02-10": { "isOffDay": true, "name": "春节" }
  }
}
```

需要转换为当前代码格式：
```javascript
{
  yearSpecific: {
    2025: [
      { date: '2025-01-01', label: '元旦' },
      { date: '2025-02-10', label: '春节' }
    ]
  },
  makeupWorkdays: {
    2025: [
      { date: '2025-01-26', label: '春节调休补班' }
    ]
  }
}
```

### 3. 缓存策略
- **LocalStorage**：存储最近3年数据
- **缓存有效期**：每年1月1日自动更新
- **缓存键**：`holiday_data_${year}`

### 4. 更新机制
- **自动检测**：页面加载时检查是否需要更新
- **后台更新**：不影响用户体验，静默更新
- **版本控制**：记录数据版本号，避免重复加载

## 实施建议

### 短期（立即实施）
1. ✅ 添加 GitHub 数据加载功能
2. ✅ 实现本地缓存机制
3. ✅ 添加降级方案

### 中期（3-6个月）
1. ✅ 添加数据自动更新提醒
2. ✅ 实现数据验证机制
3. ✅ 添加数据来源说明

### 长期（1年+）
1. ✅ 考虑建立自己的数据维护流程
2. ✅ 添加数据贡献功能（如果开源）
3. ✅ 监控数据源可用性

## 注意事项

1. **数据准确性**：GitHub 数据源依赖社区维护，建议定期验证
2. **网络依赖**：首次加载需要网络，后续可使用缓存
3. **跨域问题**：GitHub raw 内容支持 CORS，可直接使用
4. **数据格式变化**：需要处理数据源格式变更的情况

## 参考资源

- [NateScarlet/holiday-cn](https://github.com/NateScarlet/holiday-cn)
- [timor/holiday](https://github.com/timor/holiday)
- [国务院办公厅历年放假安排](http://www.gov.cn/zhengce/)

