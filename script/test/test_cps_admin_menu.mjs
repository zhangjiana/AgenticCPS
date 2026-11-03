import assert from 'node:assert/strict'
import { filterCpsAdminMenus } from '../../frontend/admin-vue3/src/utils/cpsAdminMenu.ts'

const make = (path, name = path, children = undefined) => ({ path, name, children, visible: true })

const original = [
  make('/system', '系统管理', [make('user'), make('role')]),
  make('/cps-ops', '联盟运营', [
    make('activity/square'), make('toolbox'), make('goods/square'),
    make('transfer'), make('cpx/task')
  ]),
  make('/cps-settlement', '联盟结算', [
    make('order'), make('rebate/record'), make('withdraw'),
    make('freeze'), make('asset'), make('risk'), make('statistics')
  ]),
  make('/cps-config', '联盟配置', [
    make('platform-onboarding'), make('platform'), make('api-vendor'),
    make('cpx/platform-profile')
  ]),
  make('/member', '会员中心', [make('user'), make('level')]),
  make('/mall', '商城管理', [make('product')])
]
const untouched = JSON.stringify(original)
const actual = filterCpsAdminMenus(original)

assert.deepEqual(actual.map((group) => group.path), [
  '/cps-ops', '/cps-settlement', '/cps-config', '/member'
])
assert.deepEqual(actual.map((group) => group.name), [
  '商品与推广', '订单与资金', '联盟配置', '会员管理'
])
assert.deepEqual(actual[0].children.map((child) => child.path), [
  'toolbox', 'goods/square', 'transfer'
])
assert.deepEqual(actual[1].children.map((child) => child.path), [
  'order', 'rebate/record', 'withdraw', 'freeze', 'asset', 'risk'
])
assert.deepEqual(actual[2].children.map((child) => child.path), ['platform-onboarding'])
assert.deepEqual(actual[3].children.map((child) => child.path), ['user'])
assert.equal(JSON.stringify(original), untouched, 'Source RBAC menus must remain untouched')
assert.equal(actual[0].children[0].name, '返利转链工具')
assert.equal(actual[1].children[2].name, '提现审核')
assert.equal(actual[2].children[0].name, '平台接入配置')

// Critical safety: never invent routes absent from the backend-authorized menu tree.
assert.deepEqual(filterCpsAdminMenus([make('/cps-ops', '', [make('toolbox')])])
  .flatMap((group) => group.children.map((child) => child.path)), ['toolbox'])
assert.deepEqual(filterCpsAdminMenus([make('/cps-ops', '', [make('cpx/task')])]), [])
assert.deepEqual(filterCpsAdminMenus([make('/cps-ops-fake', '', [make('toolbox')])]), [])
assert.equal(filterCpsAdminMenus([make('/cps-ops', '', [make('/cps-ops/toolbox')])])
  [0].children[0].name, '返利转链工具')

console.log('CPS admin menu scope: all regression assertions passed')
