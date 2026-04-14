/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useCallback, useEffect, useState } from "react";
import { Table } from "antd";

function applyFilterToRows(
  value: string,
  rows: any[],
  filterKeys?: string[]
): any[] {
  const v = String(value).trim().toLowerCase();
  if (!v) return rows;
  const keys =
    Array.isArray(filterKeys) && filterKeys.length > 0 ? filterKeys : null;
  return rows.filter((record: any) => {
    if (keys) {
      return keys.some((k: string) =>
        String(record[k] ?? "")
          .toLowerCase()
          .includes(v)
      );
    }
    return Object.values(record).some((field) =>
      String(field).toLowerCase().includes(v)
    );
  });
}

const Datatable = (all: any) => {
  const {
    props: tableKey,
    columns,
    dataSource = [],
    rowKey: rowKeyProp,
    filterText,
    filterKeys,
    hideBuiltinSearch = false,
    placeholder = "Search",
    ...tableRest
  } = all;

  const [searchText, setSearchText] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [filteredDataSource, setFilteredDataSource] = useState<any[]>(
    dataSource
  );

  const controlled = Boolean(hideBuiltinSearch);
  const query = controlled ? (filterText ?? "") : searchText;

  const applyFilter = useCallback(
    (value: string, rows: any[]) => {
      setFilteredDataSource(applyFilterToRows(value, rows, filterKeys));
    },
    [filterKeys]
  );

  useEffect(() => {
    applyFilter(query, dataSource);
  }, [dataSource, query, applyFilter]);

  const onSelectChange = (newSelectedRowKeys: any) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const defaultRowKey = useCallback(
    (record: any) => {
      if (typeof rowKeyProp === "function") return rowKeyProp(record);
      if (typeof rowKeyProp === "string" && record[rowKeyProp] != null) {
        return String(record[rowKeyProp]);
      }
      if (record.tableRowKey != null) return String(record.tableRowKey);
      const raw = record.id ?? record.product_id ?? record.productId;
      if (raw != null && raw !== "") {
        const n = Number(raw);
        if (Number.isFinite(n) && n > 0) return String(n);
        return String(raw);
      }
      const sku = String(record.sku ?? "").trim();
      return `row:${encodeURIComponent(sku || "unknown")}`;
    },
    [rowKeyProp]
  );

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  return (
    <>
      {!hideBuiltinSearch ? (
        <div className="search-set table-search-set">
          <div className="search-input">
            <a
              href="#"
              className="btn btn-searchset"
              onClick={(e) => e.preventDefault()}
            >
              <i className="ti ti-search fs-14 feather-search" />
            </a>
            <div id="DataTables_Table_0_filter" className="dataTables_filter">
              <label>
                {" "}
                <input
                  type="search"
                  value={searchText}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="form-control form-control-sm"
                  placeholder={placeholder}
                  aria-controls="DataTables_Table_0"
                />
              </label>
            </div>
          </div>
        </div>
      ) : null}

      <Table
        key={tableKey}
        className="table datanew dataTable no-footer"
        rowSelection={rowSelection}
        columns={columns}
        {...tableRest}
        dataSource={filteredDataSource}
        rowKey={defaultRowKey}
        pagination={{
          locale: { items_per_page: "" },
          nextIcon: (
            <span>
              <i className="fa fa-angle-right" />
            </span>
          ),
          prevIcon: (
            <span>
              <i className="fa fa-angle-left" />
            </span>
          ),
          defaultPageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "30"],
        }}
      />
    </>
  );
};

export default Datatable;
