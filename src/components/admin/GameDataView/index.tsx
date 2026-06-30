import { DefaultTemplate } from '@payloadcms/next/templates'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'

import { GameDataManager } from './manager'

export default function GameDataView(props: AdminViewServerProps) {
  const user = props.user ?? props.initPageResult.req.user

  if (!user) {
    redirect('/admin/login?redirect=/admin/game-data')
  }

  return (
    <DefaultTemplate
      i18n={props.i18n}
      locale={props.locale}
      params={props.params}
      payload={props.payload}
      permissions={props.permissions}
      req={props.initPageResult.req}
      searchParams={props.searchParams}
      user={user}
      viewType={props.viewType}
      visibleEntities={props.initPageResult.visibleEntities}
    >
      <GameDataManager />
    </DefaultTemplate>
  )
}
