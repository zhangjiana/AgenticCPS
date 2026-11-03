<template>
  <div class="cps-workbench">
    <header class="hero">
      <div class="hero-main">
        <span class="eyebrow">CPS OPERATIONS</span>
        <h1>返利运营工作台</h1>
        <p>从商品转链、订单归因到佣金结算与提现，把日常运营集中在这里。</p>
        <div class="hero-actions">
          <el-button
            v-if="canOpen('/cps-ops/toolbox')"
            type="primary"
            @click="open('/cps-ops/toolbox')"
          >
            <Icon icon="ep:link" class="mr-6px" />
            创建推广链接
          </el-button>
          <el-button
            v-if="canOpen('/cps-settlement/order')"
            @click="open('/cps-settlement/order')"
          >
            查看返利订单
          </el-button>
        </div>
      </div>
      <div class="hero-aside">
        <div class="hero-label">运营主流程</div>
        <div class="step">01 <strong>转链推广</strong></div>
        <div class="step">02 <strong>订单同步与归因</strong></div>
        <div class="step">03 <strong>结算与冻结</strong></div>
        <div class="step">04 <strong>提现与对账</strong></div>
      </div>
    </header>

    <section class="section">
      <div class="section-heading">
        <div>
          <h2>今日经营概览</h2>
          <p>仅展示来自后端 CPS 统计接口的数据，没有演示或估算数字。</p>
        </div>
        <el-button
          v-if="hasStatisticsPermission"
          text
          :loading="statisticsLoading"
          @click="loadStatistics"
        >
          <Icon icon="ep:refresh" class="mr-4px" />
          刷新
        </el-button>
      </div>

      <div class="metric-grid" v-loading="statisticsLoading">
        <div v-for="metric in metrics" :key="metric.label" class="metric-card">
          <div class="metric-top">
            <span>{{ metric.label }}</span>
            <Icon :icon="metric.icon" :size="20" />
          </div>
          <strong>{{ metric.value }}</strong>
          <div class="metric-note">{{ metric.note }}</div>
        </div>
      </div>
      <el-alert
        v-if="statisticsError"
        :title="statisticsError"
        type="info"
        :closable="false"
        show-icon
        class="mt-12px"
      />
    </section>

    <section class="section">
      <div class="section-heading">
        <div>
          <h2>业务功能</h2>
          <p>菜单与可访问页面取自当前账号的后端授权，未授权功能不会显示。</p>
        </div>
      </div>

      <div v-if="availableSections.length" class="section-grid">
        <article v-for="section in availableSections" :key="section.title" class="module-card">
          <div class="module-header">
            <span class="module-icon">
              <Icon :icon="section.icon" :size="21" />
            </span>
            <div>
              <h3>{{ section.title }}</h3>
              <p>{{ section.description }}</p>
            </div>
          </div>
          <button
            v-for="link in section.links"
            :key="link.path"
            type="button"
            class="module-link"
            @click="open(link.path)"
          >
            <span>
              <strong>{{ link.label }}</strong>
              <small>{{ link.description }}</small>
            </span>
            <Icon icon="ep:arrow-right" />
          </button>
        </article>
      </div>
      <el-empty
        v-else
        description="当前账号没有已授权的 CPS 运营菜单，请检查后台角色与联盟菜单权限"
        :image-size="90"
      />
    </section>

    <el-alert
      title="资金安全提示"
      description="返利金额以联盟最终结算为准。提现只应使用已结算、满足冻结规则且未被退款冲销的可用余额；本后台不会绕过既有审核与资金账本。"
      type="warning"
      :closable="false"
      show-icon
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePermissionStore } from '@/store/modules/permission'
import { CpsStatisticsApi, type CpsDashboardVO } from '@/api/cps/statistics'
import { checkPermi } from '@/utils/permission'

defineOptions({ name: 'CpsWorkbench' })

interface WorkspaceLink {
  label: string
  description: string
  path: string
}
interface WorkspaceSection {
  title: string
  icon: string
  description: string
  links: WorkspaceLink[]
}

const router = useRouter()
const permissionStore = usePermissionStore()
const statistics = ref<CpsDashboardVO | null>(null)
const statisticsLoading = ref(false)
const statisticsError = ref('')

const hasStatisticsPermission = computed(() => checkPermi(['cps:statistics:query']))

const sections: WorkspaceSection[] = [
  {
    title: '商品与推广',
    icon: 'ep:shopping-cart',
    description: '商品解析、推广链接与转链记录',
    links: [
      { label: '返利转链工具', description: '解析商品链接并生成推广链接', path: '/cps-ops/toolbox' },
      { label: '商品查询', description: '查询优惠券及商品佣金信息', path: '/cps-ops/goods/square' },
      { label: '转链记录', description: '追踪已生成的推广链接', path: '/cps-ops/transfer' }
    ]
  },
  {
    title: '订单与结算',
    icon: 'ep:document',
    description: '核实订单、返利记录和冻结进度',
    links: [
      { label: '订单管理', description: '订单同步、归因、人工审核与追踪', path: '/cps-settlement/order' },
      { label: '返利记录', description: '核对用户应返和实际结算', path: '/cps-settlement/rebate/record' },
      { label: '冻结规则', description: '管理解冻时间与返利冻结记录', path: '/cps-settlement/freeze' }
    ]
  },
  {
    title: '资金与风险',
    icon: 'ep:wallet',
    description: '提现审核、账本与风控',
    links: [
      { label: '提现审核', description: '处理用户提现申请及状态', path: '/cps-settlement/withdraw' },
      { label: '资金账本', description: '查看返利资产、资金流水与对账', path: '/cps-settlement/asset' },
      { label: '风控规则', description: '检查异常出款和资金风险', path: '/cps-settlement/risk' }
    ]
  },
  {
    title: '平台与会员',
    icon: 'ep:setting',
    description: '联盟 API 准入、推广位和用户管理',
    links: [
      { label: '平台接入配置', description: '统一管理供应商、推广位与返利规则', path: '/cps-config/platform-onboarding' },
      { label: '会员列表', description: '查看已授权的会员信息', path: '/member/user' }
    ]
  }
]

/** Resolve authorized dynamic routes into concrete paths, never infer access from URL alone. */
const authorizedPaths = computed(() => {
  const paths = new Set<string>()
  function visit(routes: AppRouteRecordRaw[], parent = '') {
    for (const route of routes) {
      const path = route.path.startsWith('/')
        ? route.path
        : `${parent.replace(/\/$/, '')}/${route.path}`
      const normalized = path.replace(/\/+/g, '/')
      if (!route.meta?.hidden) paths.add(normalized)
      if (route.children?.length) visit(route.children, normalized)
    }
  }
  visit(permissionStore.getRouters)
  return paths
})

const canOpen = (path: string): boolean => authorizedPaths.value.has(path)
const availableSections = computed(() =>
  sections.map((section) => ({
    ...section,
    links: section.links.filter((link) => canOpen(link.path))
  })).filter((section) => section.links.length)
)
const open = (path: string) => {
  if (canOpen(path)) void router.push(path)
}

const money = (value?: number): string => {
  if (value == null || !Number.isFinite(Number(value))) return '—'
  return '¥' + Number(value).toFixed(2)
}
const count = (value?: number): string =>
  value == null || !Number.isFinite(Number(value)) ? '—' : String(value)

const metrics = computed(() => [
  {
    label: '今日订单',
    value: count(statistics.value?.todayOrderCount),
    icon: 'ep:shopping-bag',
    note: '已同步 CPS 订单'
  },
  {
    label: '今日联盟佣金',
    value: money(statistics.value?.todayCommission),
    icon: 'ep:money',
    note: '以联盟数据为准'
  },
  {
    label: '今日用户返利',
    value: money(statistics.value?.todayRebate),
    icon: 'ep:wallet',
    note: '不等于可提现余额'
  },
  {
    label: '今日平台利润',
    value: money(statistics.value?.todayProfit),
    icon: 'ep:data-analysis',
    note: '由后端统计提供'
  },
  {
    label: '累计活跃会员',
    value: count(statistics.value?.activeMemberCount),
    icon: 'ep:user',
    note: '至少有一笔归因订单'
  }
])

async function loadStatistics() {
  if (!hasStatisticsPermission.value) {
    statisticsError.value = '当前账号未获 CPS 统计权限，业务入口仍可正常使用。'
    return
  }
  statisticsLoading.value = true
  statisticsError.value = ''
  try {
    statistics.value = await CpsStatisticsApi.getDashboard()
  } catch {
    statistics.value = null
    statisticsError.value = 'CPS 统计数据暂时不可用，请检查接口或角色权限。'
  } finally {
    statisticsLoading.value = false
  }
}

onMounted(() => {
  void loadStatistics()
})
</script>

<style scoped>
.cps-workbench {
  padding: 4px 4px 24px;
  color: var(--el-text-color-primary);
}
.hero {
  display: flex;
  justify-content: space-between;
  gap: 28px;
  padding: 32px 36px;
  border: 1px solid #d9e8ed;
  border-radius: 16px;
  background: linear-gradient(120deg, #edf8f8 0%, #f7fafc 60%, #eaf2fb 100%);
}
.hero-main {
  flex: 1 1 auto;
}
.eyebrow {
  color: #16796f;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2px;
}
.hero h1 {
  margin: 12px 0;
  color: #19333a;
  font-size: 27px;
  font-weight: 700;
}
.hero p, .section-heading p, .module-header p {
  color: #637982;
  font-size: 13px;
  line-height: 1.7;
}
.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 22px;
}
.hero-aside {
  width: 245px;
  flex: 0 0 245px;
  padding: 18px 20px;
  border: 1px solid #dbe7e7;
  border-radius: 12px;
  background: #fff;
}
.hero-label {
  margin-bottom: 12px;
  color: #62757a;
  font-size: 12px;
  font-weight: 600;
}
.step {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 7px 0;
  color: #269587;
  font-size: 12px;
}
.step strong {
  color: #304d52;
  font-weight: 500;
}
.section { margin: 26px 0 28px; }
.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 14px;
}
.section h2 {
  margin: 0 0 4px;
  font-size: 17px;
  font-weight: 700;
}
.metric-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  min-height: 116px;
}
.metric-card, .module-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-bg-color);
}
.metric-card { padding: 19px; }
.metric-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.metric-top :deep(svg) { color: #6d91a1; }
.metric-card > strong {
  display: block;
  margin-top: 17px;
  font-size: 25px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.metric-note {
  margin-top: 7px;
  color: var(--el-text-color-placeholder);
  font-size: 11px;
}
.section-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.module-card { padding: 22px; }
.module-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
}
.module-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  color: #1a8079;
  background: #e6f5f2;
}
.module-header h3 { margin: 0; font-size: 16px; }
.module-header p { margin: 5px 0 0; }
.module-link {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  padding: 12px 8px;
  border: none;
  border-top: 1px solid var(--el-border-color-extra-light);
  background: transparent;
  color: var(--el-text-color-primary);
  cursor: pointer;
  text-align: left;
}
.module-link:hover { color: #148078; background: var(--el-fill-color-light); }
.module-link strong { display: block; margin-bottom: 5px; font-size: 13px; }
.module-link small { color: var(--el-text-color-secondary); font-size: 11px; }
@media (max-width: 1200px) { .metric-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 840px) {
  .hero { flex-direction: column; padding: 24px; }
  .hero-aside { width: 100%; flex-basis: auto; }
  .section-grid { grid-template-columns: 1fr; }
  .metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 520px) { .metric-grid { grid-template-columns: 1fr; } }
</style>
