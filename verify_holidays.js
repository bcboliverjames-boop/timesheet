// 节假日数据验证脚本
// 对比代码中的硬编码数据和Nager.Date API的真实数据

const countries = [
  { name: 'us', code: 'US', displayName: '美国' },
  { name: 'germany', code: 'DE', displayName: '德国' },
  { name: 'japan', code: 'JP', displayName: '日本' },
  { name: 'singapore', code: 'SG', displayName: '新加坡' }
];

const years = [2025, 2026];

// 缓存相关常量
const CACHE_KEY = 'verify_holidays_cache';
const CACHE_UPDATED_KEY = 'verify_holidays_last_updated';
const CACHE_MAX_AGE_MS = 25 * 24 * 60 * 60 * 1000; // 25天过期
const MAX_RETRY = 5;
const RETRY_DELAY_MS = 500; // 初始重试间隔，后续线性增长

// 兼容 Node 环境无 localStorage 的情况
const storage = typeof localStorage !== 'undefined' ? localStorage : null;

// 缓存数据载入
function loadHolidayCache() {
  if (!storage) {
    return { data: {}, lastUpdated: 0 };
  }
  try {
    const raw = storage.getItem(CACHE_KEY);
    const lastUpdated = parseInt(storage.getItem(CACHE_UPDATED_KEY), 10) || 0;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.data) {
        return { data: parsed.data, lastUpdated };
      }
    }
  } catch (e) {
    console.warn('读取节假日缓存失败，使用空缓存:', e);
  }
  return { data: {}, lastUpdated: 0 };
}

// 全局缓存对象（内存与 localStorage 同步）
const holidayCache = loadHolidayCache();

function persistHolidayCache() {
  if (!storage) {
    return;
  }
  try {
    storage.setItem(CACHE_KEY, JSON.stringify({ data: holidayCache.data }));
    storage.setItem(CACHE_UPDATED_KEY, String(holidayCache.lastUpdated || 0));
  } catch (e) {
    console.warn('保存节假日缓存失败:', e);
  }
}

function getCachedHolidays(countryCode, year) {
  return holidayCache.data?.[countryCode]?.[year] || null;
}

function shouldRefreshCache() {
  if (!holidayCache.lastUpdated) return true;
  return Date.now() - holidayCache.lastUpdated > CACHE_MAX_AGE_MS;
}

function updateCacheEntry(countryCode, year, holidays) {
  if (!holidayCache.data[countryCode]) {
    holidayCache.data[countryCode] = {};
  }
  holidayCache.data[countryCode][year] = holidays;
  holidayCache.lastUpdated = Date.now();
  persistHolidayCache();
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 代码中的硬编码节假日配置（从index.html提取）
const HOLIDAY_CONFIG = {
  us: {
    recurring: [
      { date: '01-01', label: 'New Year\'s Day' },
      { date: '01-20', label: 'MLK Day' },
      { date: '02-17', label: 'Presidents\' Day' },
      { date: '05-26', label: 'Memorial Day' },
      { date: '07-04', label: 'Independence Day' },
      { date: '09-01', label: 'Labor Day' },
      { date: '11-27', label: 'Thanksgiving' },
      { date: '11-28', label: 'Thanksgiving' },
      { date: '12-25', label: 'Christmas' }
    ],
    yearSpecific: {},
    makeupWorkdays: {}
  },
  germany: {
    recurring: [
      { date: '01-01', label: 'New Year\'s Day' },
      { date: '05-01', label: 'Labour Day' },
      { date: '10-03', label: 'German Unity Day' },
      { date: '12-25', label: 'Christmas Day' },
      { date: '12-26', label: 'Boxing Day' }
    ],
    yearSpecific: {},
    makeupWorkdays: {}
  },
  japan: {
    recurring: [
      { date: '01-01', label: 'New Year\'s Day' },
      { date: '02-11', label: 'National Foundation Day' },
      { date: '04-29', label: 'Showa Day' },
      { date: '05-03', label: 'Constitution Memorial Day' },
      { date: '05-04', label: 'Greenery Day' },
      { date: '05-05', label: 'Children\'s Day' },
      { date: '08-11', label: 'Mountain Day' },
      { date: '11-03', label: 'Culture Day' },
      { date: '11-23', label: 'Labour Thanksgiving Day' },
      { date: '12-23', label: 'Emperor\'s Birthday' }
    ],
    yearSpecific: {},
    makeupWorkdays: {}
  },
  singapore: {
    recurring: [
      { date: '01-01', label: 'New Year\'s Day' },
      { date: '05-01', label: 'Labour Day' },
      { date: '08-09', label: 'National Day' },
      { date: '12-25', label: 'Christmas Day' }
    ],
    yearSpecific: {},
    makeupWorkdays: {}
  }
};

// 从Nager.Date API获取节假日数据
async function fetchHolidaysFromAPI(countryCode, year) {
  const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`;

  // 若缓存存在且未过期，直接返回缓存
  const cached = getCachedHolidays(countryCode, year);
  const needsRefresh = shouldRefreshCache();
  if (cached && !needsRefresh) {
    return cached;
  }

  // 带重试的获取逻辑
  let lastError = null;
  for (let attempt = 1; attempt <= MAX_RETRY; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const holidays = data.map(item => ({
          date: item.date,
          label: item.localName || item.name
        })).sort((a, b) => a.date.localeCompare(b.date));

        // 成功后更新缓存与 lastUpdated
        updateCacheEntry(countryCode, year, holidays);
        return holidays;
      }
      lastError = new Error(`Status ${response.status}`);
      console.warn(`获取 ${countryCode} ${year} 节假日失败，状态码: ${response.status} (尝试 ${attempt}/${MAX_RETRY})`);
    } catch (error) {
      lastError = error;
      console.warn(`获取 ${countryCode} ${year} 节假日异常 (尝试 ${attempt}/${MAX_RETRY}):`, error);
    }

    // 失败时等待后退避
    await wait(RETRY_DELAY_MS * attempt);
  }

  // 全部尝试失败时保留旧缓存
  console.error(`获取 ${countryCode} ${year} 节假日失败，已重试 ${MAX_RETRY} 次`, lastError);
  return cached || null;
}

// 将硬编码的recurring日期转换为具体年份的日期
function expandRecurringHolidays(config, year) {
  const holidays = [];
  
  // 处理固定节假日（recurring）
  if (config.recurring) {
    config.recurring.forEach(({ date, label }) => {
      // date格式可能是 '01-01' 或 '01-20'
      const [month, day] = date.split('-').map(Number);
      const fullDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      holidays.push({ date: fullDate, label });
    });
  }
  
  // 处理特定年份的节假日
  if (config.yearSpecific && config.yearSpecific[year]) {
    config.yearSpecific[year].forEach(({ date, label }) => {
      holidays.push({ date, label });
    });
  }
  
  return holidays.sort((a, b) => a.date.localeCompare(b.date));
}

// 对比两个节假日列表
function compareHolidays(codeHolidays, apiHolidays) {
  const codeDates = new Set(codeHolidays.map(h => h.date));
  const apiDates = new Set(apiHolidays.map(h => h.date));
  
  const missingInCode = apiHolidays.filter(h => !codeDates.has(h.date));
  const missingInAPI = codeHolidays.filter(h => !apiDates.has(h.date));
  const matching = codeHolidays.filter(h => apiDates.has(h.date));
  
  return {
    matching,
    missingInCode,
    missingInAPI,
    codeCount: codeHolidays.length,
    apiCount: apiHolidays.length
  };
}

// 主验证函数
async function verifyHolidays() {
  console.log('='.repeat(80));
  console.log('节假日数据验证报告');
  console.log('='.repeat(80));
  console.log();
  
  for (const country of countries) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`国家: ${country.displayName} (${country.code})`);
    console.log('='.repeat(80));
    
    for (const year of years) {
      console.log(`\n--- ${year}年 ---`);
      
      // 获取API数据
      const apiHolidays = await fetchHolidaysFromAPI(country.code, year);
      if (!apiHolidays) {
        console.log(`❌ 无法从API获取${year}年数据`);
        continue;
      }
      
      // 获取代码中的硬编码数据
      const config = HOLIDAY_CONFIG[country.name];
      if (!config) {
        console.log(`❌ 代码中未找到${country.name}的配置`);
        continue;
      }
      
      const codeHolidays = expandRecurringHolidays(config, year);
      
      // 对比
      const comparison = compareHolidays(codeHolidays, apiHolidays);
      
      console.log(`\n代码中的节假日数量: ${comparison.codeCount}`);
      console.log(`API中的节假日数量: ${comparison.apiCount}`);
      console.log(`匹配的节假日数量: ${comparison.matching.length}`);
      
      if (comparison.missingInCode.length > 0) {
        console.log(`\n⚠️  代码中缺失的节假日 (${comparison.missingInCode.length}个):`);
        comparison.missingInCode.forEach(h => {
          console.log(`   - ${h.date}: ${h.label}`);
        });
      }
      
      if (comparison.missingInAPI.length > 0) {
        console.log(`\n⚠️  API中缺失的节假日 (${comparison.missingInAPI.length}个):`);
        comparison.missingInAPI.forEach(h => {
          console.log(`   - ${h.date}: ${h.label}`);
        });
      }
      
      if (comparison.missingInCode.length === 0 && comparison.missingInAPI.length === 0) {
        console.log(`\n✅ 完全匹配！`);
      } else {
        // 显示匹配的节假日
        if (comparison.matching.length > 0) {
          console.log(`\n✓ 匹配的节假日 (${comparison.matching.length}个):`);
          comparison.matching.slice(0, 5).forEach(h => {
            console.log(`   - ${h.date}: ${h.label}`);
          });
          if (comparison.matching.length > 5) {
            console.log(`   ... 还有 ${comparison.matching.length - 5} 个`);
          }
        }
      }
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('验证完成');
  console.log('='.repeat(80));
}

// 运行验证
if (typeof window === 'undefined') {
  // Node.js环境
  if (typeof fetch === 'undefined') {
    try {
      const nodeFetch = require('node-fetch');
      global.fetch = nodeFetch;
    } catch (error) {
      console.error('当前 Node 版本未内置 fetch，且未安装 node-fetch，请安装依赖或升级 Node 以继续。', error);
      process.exitCode = 1;
      return;
    }
  } else {
    // Node 18+ 已内置 fetch
    global.fetch = fetch;
  }
  verifyHolidays().catch(console.error);
} else {
  // 浏览器环境
  window.verifyHolidays = verifyHolidays;
  console.log('验证函数已加载，请在浏览器控制台运行: verifyHolidays()');
}

