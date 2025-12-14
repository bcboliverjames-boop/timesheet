// 节假日数据验证脚本
// 对比代码中的硬编码数据和Nager.Date API的真实数据

const countries = [
  { name: 'us', code: 'US', displayName: '美国' },
  { name: 'germany', code: 'DE', displayName: '德国' },
  { name: 'japan', code: 'JP', displayName: '日本' },
  { name: 'singapore', code: 'SG', displayName: '新加坡' }
];

const years = [2025, 2026];

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
  try {
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      return data.map(item => ({
        date: item.date,
        label: item.localName || item.name
      })).sort((a, b) => a.date.localeCompare(b.date));
    }
  } catch (error) {
    console.error(`Error fetching ${countryCode} ${year}:`, error);
  }
  return null;
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
  const fetch = require('node-fetch');
  global.fetch = fetch;
  verifyHolidays().catch(console.error);
} else {
  // 浏览器环境
  window.verifyHolidays = verifyHolidays;
  console.log('验证函数已加载，请在浏览器控制台运行: verifyHolidays()');
}

