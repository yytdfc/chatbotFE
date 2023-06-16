// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { useEffect, useRef, useState } from 'react';
import { useCollection } from '@cloudscape-design/collection-hooks';
import { COLUMN_DEFINITIONS, DEFAULT_PREFERENCES, Preferences,} from './table-config';
import { Flashbar, Pagination, Table, TextFilter } from '@cloudscape-design/components';
import { FullPageHeader ,Breadcrumbs,} from './common-components';
import {
  CustomAppLayout,
  Navigation,
  TableNoMatchState,
  TableEmptyState,
  ToolsContent,
} from '../commons/common-components';
import { paginationLabels,distributionSelectionLabels } from '../../common/labels';
import { getFilterCounterText } from '../../common/tableCounterStrings';
import { useColumnWidths } from '../commons/use-column-widths';
import { useLocalStorage } from '../../common/localStorage';
import {useSimpleNotifications} from '../commons/use-notifications';
import {useAuthorizedHeader} from "../commons/use-auth";
import {listDocIdx} from '../commons/api-gateway';
import { useTranslation } from 'react-i18next';


function TableContent({ 
  resourceName,
  distributions,
  loadingState,
  refreshAction,
  buttonName,
  buttonHref,
 }) {
  const [preferences, setPreferences] = useLocalStorage('Benchportal-Docs-Table-Preferences', DEFAULT_PREFERENCES);
  const [columnDefinitions, saveWidths] = useColumnWidths('Benchportal-React-Table-Widths', COLUMN_DEFINITIONS);
  const {t} = useTranslation();

  const { items, actions, filteredItemsCount, collectionProps, filterProps, paginationProps } = useCollection(
    distributions,
    {
      filtering: {
        empty: <TableEmptyState resourceName={resourceName} />,
        noMatch: <TableNoMatchState onClearFilter={() => actions.setFiltering('')} />,
      },
      pagination: { pageSize: preferences.pageSize },
      sorting: { defaultState: { sortingColumn: columnDefinitions[0] } },
      selection: {},
    }
  );

  return (
    <Table
     {...collectionProps}
      columnDefinitions={columnDefinitions}
      visibleColumns={preferences.visibleContent}
      items={items}
      selectionType="single"
      loading = {loadingState}
      loadingText = {t("loading")}
      ariaLabels={distributionSelectionLabels}
      variant="full-page"
      stickyHeader={true}
      resizableColumns={true}
      onColumnWidthsChange={saveWidths}
      wrapLines={preferences.wrapLines}
      filter={
        <TextFilter
          {...filterProps}
          filteringAriaLabel="Filter "
          filteringPlaceholder="Find "
          countText={getFilterCounterText(filteredItemsCount)}
        />
      }
      header={
        <FullPageHeader
          selectedItems={collectionProps.selectedItems}
          totalItems={distributions}
          resourceName={resourceName}
          createButtonText={buttonName}
          refreshAction={refreshAction}
          href={buttonHref}
        />
      }
      pagination={<Pagination {...paginationProps} ariaLabels={paginationLabels} />}
      preferences={<Preferences preferences={preferences} setPreferences={setPreferences} />}
    />
  );
}

export default function DocsTable () {
  const appLayout = useRef();
  const {notificationitems} = useSimpleNotifications();
  const [toolsOpen, setToolsOpen] = useState(false);
  const {t} = useTranslation();
  const headers = useAuthorizedHeader();
  const [loadingState, setLoadingState] = useState(true);
  const [docitems,setDocsItems] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const refreshAction =()=>{
    setRefresh(v => !v);
  }
  useEffect(()=>{
    listDocIdx(headers)
    .then(data =>{
      setDocsItems(data);
        setLoadingState(false);
    })
    .catch(err =>{
      setDocsItems([]);
        setLoadingState(false);
        console.log(JSON.stringify(err))
    }
    )
},[refresh]);

  return (
    <CustomAppLayout
      ref={appLayout}
      navigation={<Navigation activeHref={'/docs'} />}
      notifications={<Flashbar items={notificationitems} />}
      breadcrumbs={<Breadcrumbs />}
      content={<TableContent 
                resourceName={t('docs')}
                distributions = {docitems}
                loadingState={loadingState}
                refreshAction={refreshAction}
            />}
      contentType="table"
      stickyNotifications
      tools={<ToolsContent />}
      toolsOpen={toolsOpen}
      onToolsChange={({ detail }) => setToolsOpen(detail.open)}
    />
  );
}
