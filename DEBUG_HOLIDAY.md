# 节假日数据调试指南

## 🔍 问题诊断步骤

### 步骤1：检查浏览器控制台

打开浏览器开发者工具（F12），查看 Console 标签页，应该能看到以下日志：

```
[节假日数据] 开始加载年份: [2024, 2025, 2026]
[节假日数据] 从 https://raw.githubusercontent.com/... 加载成功: {...}
[节假日数据] 2026年解析成功: {...}
[节假日数据] 2026年加载结果: { hasHolidays: true, hasMakeup: true, ... }
```

### 步骤2：检查网络请求

1. 打开开发者工具 → Network 标签页
2. 刷新页面或重新计算
3. 查找对 `githubusercontent.com` 或 `jsdelivr.net` 的请求
4. 检查请求状态：
   - ✅ 200：请求成功
   - ❌ 404：数据源没有该年份数据
   - ❌ CORS 错误：跨域问题

### 步骤3：检查 LocalStorage 缓存

在浏览器控制台执行：

```javascript
// 检查2026年缓存
const cached = localStorage.getItem('holiday_data_2026');
if (cached) {
  const data = JSON.parse(cached);
  console.log('2026年缓存数据:', data);
  console.log('节假日数量:', data.data?.yearSpecific?.[2026]?.length || 0);
  console.log('调休数量:', data.data?.makeupWorkdays?.[2026]?.length || 0);
} else {
  console.log('2026年没有缓存数据');
}
```

### 步骤4：手动测试数据加载

在浏览器控制台执行：

```javascript
// 测试加载2026年数据
loadHolidayDataForYear(2026).then(data => {
  console.log('2026年加载结果:', data);
  console.log('节假日:', data.yearSpecific?.[2026]);
  console.log('调休:', data.makeupWorkdays?.[2026]);
});
```

### 步骤5：检查数据源

直接在浏览器访问以下URL，查看数据源是否可用：

```
https://raw.githubusercontent.com/NateScarlet/holiday-cn/master/2026.json
```

**可能的结果：**
- ✅ 返回 JSON 数据：数据源可用
- ❌ 返回 404：数据源还没有2026年数据
- ❌ 返回其他错误：数据源有问题

## 🐛 常见问题

### 问题1：GitHub 数据源没有2026年数据

**现象：**
- 控制台显示：`[节假日数据] 2026年数据加载失败，所有数据源都不可用`
- Network 显示 404 错误

**原因：**
GitHub 仓库可能还没有更新2026年的数据（通常国务院在10-11月发布下一年安排）

**解决方案：**
1. 等待数据源更新
2. 或者手动添加2026年数据到本地缓存

### 问题2：数据解析失败

**现象：**
- 控制台显示：`[节假日数据] 2026年数据解析后为空`
- 数据加载成功，但解析结果为空

**原因：**
数据格式可能与预期不同

**解决方案：**
检查实际的数据格式，调整解析函数

### 问题3：缓存问题

**现象：**
- 数据已加载，但计算时仍不正确

**解决方案：**
```javascript
// 清除所有缓存
localStorage.clear();
// 刷新页面
location.reload();
```

## 🔧 手动添加2026年数据（临时方案）

如果数据源没有2026年数据，可以手动添加到 LocalStorage：

```javascript
// 在浏览器控制台执行
const year2026Data = {
  cacheYear: 2025,
  data: {
    yearSpecific: {
      2026: [
        { date: '2026-01-01', label: '元旦' },
        { date: '2026-02-06', label: '春节假期' },
        { date: '2026-02-07', label: '春节假期' },
        { date: '2026-02-08', label: '春节假期' },
        { date: '2026-02-09', label: '春节假期' },
        { date: '2026-02-10', label: '春节假期' },
        { date: '2026-02-11', label: '春节假期' },
        { date: '2026-02-12', label: '春节假期' },
        { date: '2026-04-05', label: '清明节' },
        { date: '2026-05-01', label: '劳动节' },
        { date: '2026-06-10', label: '端午节' },
        { date: '2026-09-15', label: '中秋节' },
        { date: '2026-09-16', label: '中秋节' },
        { date: '2026-09-17', label: '中秋节' },
        { date: '2026-10-01', label: '国庆节假期' },
        { date: '2026-10-02', label: '国庆节假期' },
        { date: '2026-10-03', label: '国庆节假期' },
        { date: '2026-10-04', label: '国庆节假期' },
        { date: '2026-10-05', label: '国庆节假期' },
        { date: '2026-10-06', label: '国庆节假期' },
        { date: '2026-10-07', label: '国庆节假期' },
        { date: '2026-10-08', label: '国庆节假期' }
      ]
    },
    makeupWorkdays: {
      2026: [
        // 根据实际调休安排添加
        // { date: '2026-01-XX', label: '春节调休补班' },
        // { date: '2026-09-XX', label: '国庆调休补班' }
      ]
    }
  },
  timestamp: Date.now()
};

localStorage.setItem('holiday_data_2026', JSON.stringify(year2026Data));
console.log('2026年数据已手动添加');
```

**注意：** 以上日期是示例，需要根据国务院实际发布的2026年放假安排更新。

## 📋 诊断检查清单

- [ ] 打开浏览器控制台，查看是否有错误信息
- [ ] 检查 Network 标签页，查看数据加载请求
- [ ] 检查 LocalStorage 中是否有缓存数据
- [ ] 手动测试数据加载函数
- [ ] 检查数据源 URL 是否可访问
- [ ] 清除缓存后重新测试

## 🎯 下一步

根据诊断结果：
1. 如果数据源没有2026年数据 → 等待更新或手动添加
2. 如果数据加载失败 → 检查网络或跨域问题
3. 如果数据解析失败 → 检查数据格式
4. 如果缓存问题 → 清除缓存重试

