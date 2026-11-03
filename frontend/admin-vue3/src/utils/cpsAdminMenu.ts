/**
 * CPS-only operations workspace.
 *
 * Keep the existing backend RBAC menu tree as the source of truth. This function
 * only narrows its presentation; it NEVER grants any menu or API permission.
 *
 * The MVP intentionally excludes CPX campaigns, AI, Token, shopping mall and
 * general-purpose system administration. They remain in the original codebase.
 */
type MenuNode<T> = {
  path: string
  name?: string
  children?: T[]
}

const groups: Record<string, { title: string; entries: Record<string, string> }> = {
  '/cps-ops': {
    title: '商品与推广',
    entries: {
      'toolbox': '返利转链工具',
      'goods/square': '商品查询',
      'transfer': '转链记录'
    }
  },
  '/cps-settlement': {
    title: '订单与资金',
    entries: {
      'order': '订单管理',
      'rebate/record': '返利记录',
      'withdraw': '提现审核',
      'freeze': '冻结规则',
      'asset': '资金账本',
      'risk': '风控规则'
    }
  },
  '/cps-config': {
    title: '联盟配置',
    entries: {
      'platform-onboarding': '平台接入配置'
    }
  },
  '/member': {
    title: '会员管理',
    entries: {
      'user': '会员列表'
    }
  }
}

const normalize = (value: string): string =>
  '/' + String(value || '').split('/').filter(Boolean).join('/')

/** Limit navigation to explicitly approved CPS business pages, without changing RBAC. */
export function filterCpsAdminMenus<T extends MenuNode<T>>(menus: T[]): T[] {
  return menus.flatMap((menu) => {
    const root = normalize(menu.path)
    const group = groups[root]
    if (!group || !menu.children?.length) return []

    const children = menu.children
      .filter((child) => {
        const childPath = normalize(child.path)
        const local = childPath.startsWith(root + '/')
          ? childPath.slice(root.length + 1)
          : childPath.slice(1)
        return Object.prototype.hasOwnProperty.call(group.entries, local)
      })
      .map((child) => {
        const childPath = normalize(child.path)
        const local = childPath.startsWith(root + '/')
          ? childPath.slice(root.length + 1)
          : childPath.slice(1)
        return { ...child, name: group.entries[local] }
      })

    if (!children.length) return []
    return [{ ...menu, name: group.title, children } as T]
  })
}
