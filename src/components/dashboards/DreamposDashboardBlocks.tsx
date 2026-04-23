"use client";
/* eslint-disable-next-line @next/next/no-img-element */

import type { ReactNode } from "react";
import Link from "next/link";
import { all_routes } from "@/data/all_routes";
import type { OverviewChanges, OverviewToday } from "@/types/stats";
import HeatmapChart from "../charts/heartchat";
import SalesStatisticsChart from "../charts/salesstatisticschart";
import TopCategoryChart from "../charts/topcategory";

function fmtUsd(v: number | string | null | undefined): string {
  if (v == null || v === "") return "—";
  const n = Number(String(v).replace(",", "."));
  if (!Number.isFinite(n)) return "—";
  return `$${n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtBs(v: number | string | null | undefined): string {
  if (v == null || v === "") return "—";
  const n = Number(String(v).replace(",", "."));
  if (!Number.isFinite(n)) return "—";
  return `Bs. ${n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function SkeletonValue() {
  return (
    <span className="placeholder-glow">
      <span className="placeholder col-8 rounded" />
    </span>
  );
}

function pctBadge(pct: number | null | undefined): ReactNode {
  if (pct == null) return null;
  const abs = Math.abs(pct).toFixed(1);
  if (pct > 0) {
    return (
      <span className="badge badge-soft-success ms-1">
        <i className="ti ti-arrow-up me-1" />+{abs}%
      </span>
    );
  }
  if (pct < 0) {
    return (
      <span className="badge badge-soft-danger ms-1">
        <i className="ti ti-arrow-down me-1" />
        {abs}%
      </span>
    );
  }
  return <span className="badge badge-soft-primary ms-1">= 0%</span>;
}

export interface DreamposDashboardBlocksProps {
  loading: boolean;
  today: OverviewToday | undefined;
  changes: OverviewChanges | undefined;
}

/**
 * Bloques DreamPOS (Top Selling, Low Stock, gráficas, etc.)
 * compartidos entre `/dashboard` (tema oscuro) y `NewDashboard`.
 */
export default function DreamposDashboardBlocks({
  loading,
  today,
  changes,
}: DreamposDashboardBlocksProps) {
  const route = all_routes;

  return (
    <>
      <div className="row">
        <div className="col-xxl-4 col-md-6 d-flex">
          <div className="card flex-fill">
            <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div className="d-inline-flex align-items-center">
                <span className="title-icon bg-soft-pink fs-16 me-2">
                  <i className="ti ti-box" />
                </span>
                <h5 className="card-title mb-0">Top Selling Products</h5>
              </div>
            </div>
            <div className="card-body sell-product">
              <div className="d-flex align-items-center justify-content-between border-bottom">
                <div className="d-flex align-items-center">
                  <Link href="#" className="avatar avatar-lg">
                    <img src="assets/img/products/product-01.jpg" alt="img" />
                  </Link>
                  <div className="ms-2">
                    <h6 className="fw-bold mb-1">
                      <Link href="#">Charger Cable - Lighting</Link>
                    </h6>
                    <div className="d-flex align-items-center item-list">
                      <p>$187</p>
                      <p>247+ Sales</p>
                    </div>
                  </div>
                </div>
                <span className="badge bg-outline-success badge-xs d-inline-flex align-items-center">
                  <i className="ti ti-arrow-up-left me-1" />
                  25%
                </span>
              </div>
              <div className="d-flex align-items-center justify-content-between border-bottom">
                <div className="d-flex align-items-center">
                  <Link href="#" className="avatar avatar-lg">
                    <img src="assets/img/products/product-16.jpg" alt="img" />
                  </Link>
                  <div className="ms-2">
                    <h6 className="fw-bold mb-1">
                      <Link href="#">Yves Saint Eau De Parfum</Link>
                    </h6>
                    <div className="d-flex align-items-center item-list">
                      <p>$145</p>
                      <p>289+ Sales</p>
                    </div>
                  </div>
                </div>
                <span className="badge bg-outline-success badge-xs d-inline-flex align-items-center">
                  <i className="ti ti-arrow-up-left me-1" />
                  25%
                </span>
              </div>
              <div className="d-flex align-items-center justify-content-between border-bottom">
                <div className="d-flex align-items-center">
                  <Link href="#" className="avatar avatar-lg">
                    <img src="assets/img/products/product-03.jpg" alt="img" />
                  </Link>
                  <div className="ms-2">
                    <h6 className="fw-bold mb-1">
                      <Link href="#">Apple Airpods 2</Link>
                    </h6>
                    <div className="d-flex align-items-center item-list">
                      <p>$458</p>
                      <p>300+ Sales</p>
                    </div>
                  </div>
                </div>
                <span className="badge bg-outline-success badge-xs d-inline-flex align-items-center">
                  <i className="ti ti-arrow-up-left me-1" />
                  25%
                </span>
              </div>
              <div className="d-flex align-items-center justify-content-between border-bottom">
                <div className="d-flex align-items-center">
                  <Link href="#" className="avatar avatar-lg">
                    <img src="assets/img/products/product-04.jpg" alt="img" />
                  </Link>
                  <div className="ms-2">
                    <h6 className="fw-bold mb-1">
                      <Link href="#">Vacuum Cleaner</Link>
                    </h6>
                    <div className="d-flex align-items-center item-list">
                      <p>$139</p>
                      <p>225+ Sales</p>
                    </div>
                  </div>
                </div>
                <span className="badge bg-outline-danger badge-xs d-inline-flex align-items-center">
                  <i className="ti ti-arrow-down-left me-1" />
                  21%
                </span>
              </div>
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <Link href="#" className="avatar avatar-lg">
                    <img src="assets/img/products/product-05.jpg" alt="img" />
                  </Link>
                  <div className="ms-2">
                    <h6 className="fw-bold mb-1">
                      <Link href="#">Samsung Galaxy S21 Fe 5g</Link>
                    </h6>
                    <div className="d-flex align-items-center item-list">
                      <p>$898</p>
                      <p>365+ Sales</p>
                    </div>
                  </div>
                </div>
                <span className="badge bg-outline-success badge-xs d-inline-flex align-items-center">
                  <i className="ti ti-arrow-up-left me-1" />
                  25%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xxl-4 col-md-6 d-flex">
          <div className="card flex-fill">
            <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div className="d-inline-flex align-items-center">
                <span className="title-icon bg-soft-danger fs-16 me-2">
                  <i className="ti ti-alert-triangle" />
                </span>
                <h5 className="card-title mb-0">Low Stock Products</h5>
              </div>
              <Link href={route.lowstock} className="fs-13 fw-bold text-decoration-underline">
                View All
              </Link>
            </div>
            <div className="card-body">
              {[
                { img: "product-06.jpg", name: "Dell XPS 13", id: "#665814", qty: "08" },
                { img: "product-07.jpg", name: "Vacuum Cleaner Robot", id: "#940004", qty: "14" },
                { img: "product-08.jpg", name: "KitchenAid Stand Mixer", id: "#325569", qty: "21" },
                { img: "product-09.jpg", name: "Levi's Trucker Jacket", id: "#124588", qty: "12" },
                { img: "product-10.jpg", name: "Lay's Classic", id: "#365586", qty: "10" },
              ].map((p, i, arr) => (
                <div
                  key={p.id}
                  className={`d-flex align-items-center justify-content-between${i < arr.length - 1 ? " mb-4" : " mb-0"}`}
                >
                  <div className="d-flex align-items-center">
                    <Link href="#" className="avatar avatar-lg">
                      <img src={`assets/img/products/${p.img}`} alt="img" />
                    </Link>
                    <div className="ms-2">
                      <h6 className="fw-bold mb-1">
                        <Link href="#">{p.name}</Link>
                      </h6>
                      <p className="fs-13">ID : {p.id}</p>
                    </div>
                  </div>
                  <div className="text-end">
                    <p className="fs-13 mb-1">Instock</p>
                    <h6 className="text-orange fw-bold">{p.qty}</h6>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-xxl-4 col-md-12 d-flex">
          <div className="card flex-fill">
            <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div className="d-inline-flex align-items-center">
                <span className="title-icon bg-soft-pink fs-16 me-2">
                  <i className="ti ti-box" />
                </span>
                <h5 className="card-title mb-0">Recent Sales</h5>
              </div>
              <Link href={route.ventasPedidos} className="fs-13 fw-medium text-decoration-underline">
                Ver todas
              </Link>
            </div>
            <div className="card-body">
              <p className="text-muted small">
                Ver el historial completo en{" "}
                <Link href={route.ventasPedidos} className="text-decoration-underline">
                  Pedidos y Ventas
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-xl-6 col-sm-12 col-12 d-flex">
          <div className="card flex-fill">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div className="d-inline-flex align-items-center">
                <span className="title-icon bg-soft-danger fs-16 me-2">
                  <i className="ti ti-alert-triangle" />
                </span>
                <h5 className="card-title mb-0">Sales Statics</h5>
              </div>
            </div>
            <div className="card-body pb-0">
              <div className="d-flex align-items-center flex-wrap gap-2">
                <div className="border p-2 br-8">
                  <h5 className="d-inline-flex align-items-center text-teal">
                    {loading ? <SkeletonValue /> : fmtUsd(today?.revenue_usd)}
                    {!loading && pctBadge(changes?.revenue_pct)}
                  </h5>
                  <p>Ingresos USD hoy</p>
                </div>
                <div className="border p-2 br-8">
                  <h5 className="d-inline-flex align-items-center text-orange">
                    {loading ? <SkeletonValue /> : fmtBs(today?.pending_bs)}
                  </h5>
                  <p>Pendiente Bs</p>
                </div>
              </div>
              <div id="sales-statistics">
                <SalesStatisticsChart />
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-6 col-sm-12 col-12 d-flex">
          <div className="card flex-fill">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-3">
              <div className="d-inline-flex align-items-center">
                <span className="title-icon bg-soft-orange fs-16 me-2">
                  <i className="ti ti-flag" />
                </span>
                <h5 className="card-title mb-0">Últimas Ventas</h5>
              </div>
              <Link href={route.ventasPedidos} className="fs-13 fw-medium text-decoration-underline">
                Ver todas
              </Link>
            </div>
            <div className="card-body d-flex align-items-center justify-content-center text-muted">
              <p>
                Accede al historial completo en{" "}
                <Link href={route.ventasPedidos} className="text-decoration-underline">
                  Pedidos y Ventas
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-xxl-4 col-md-6 d-flex">
          <div className="card flex-fill">
            <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div className="d-inline-flex align-items-center">
                <span className="title-icon bg-soft-orange fs-16 me-2">
                  <i className="ti ti-users" />
                </span>
                <h5 className="card-title mb-0">Top Customers</h5>
              </div>
              <Link href={route.customer} className="fs-13 fw-medium text-decoration-underline">
                View All
              </Link>
            </div>
            <div className="card-body">
              {[
                { img: "customer11.jpg", name: "Carlos Curran", loc: "USA", orders: 24, total: "$8,9645" },
                { img: "customer12.jpg", name: "Stan Gaunter", loc: "UAE", orders: 22, total: "$16,985" },
                { img: "customer13.jpg", name: "Richard Wilson", loc: "Germany", orders: 14, total: "$5,366" },
                { img: "customer14.jpg", name: "Mary Bronson", loc: "Belgium", orders: 8, total: "$4,569" },
                { img: "customer15.jpg", name: "Annie Tremblay", loc: "Greenland", orders: 14, total: "$3,5698" },
              ].map((c, i, arr) => (
                <div
                  key={c.name}
                  className={`d-flex align-items-center justify-content-between flex-wrap gap-2${
                    i < arr.length - 1 ? " border-bottom mb-3 pb-3" : ""
                  }`}
                >
                  <div className="d-flex align-items-center">
                    <Link href="#" className="avatar avatar-lg flex-shrink-0">
                      <img src={`assets/img/customer/${c.img}`} alt="img" />
                    </Link>
                    <div className="ms-2">
                      <h6 className="fs-14 fw-bold mb-1">
                        <Link href="#">{c.name}</Link>
                      </h6>
                      <div className="d-flex align-items-center item-list">
                        <p className="d-inline-flex align-items-center">
                          <i className="ti ti-map-pin me-1" />
                          {c.loc}
                        </p>
                        <p>{c.orders} Orders</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-end">
                    <h5>{c.total}</h5>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-xxl-4 col-md-6 d-flex">
          <div className="card flex-fill">
            <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div className="d-inline-flex align-items-center">
                <span className="title-icon bg-soft-orange fs-16 me-2">
                  <i className="ti ti-users" />
                </span>
                <h5 className="card-title mb-0">Top Categories</h5>
              </div>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-4 mb-4">
                <div>
                  <TopCategoryChart />
                </div>
                <div>
                  <div className="category-item category-primary">
                    <p className="fs-13 mb-1">Electronics</p>
                    <h2 className="d-flex align-items-center">
                      698{" "}
                      <span className="fs-13 fw-normal text-default ms-1">Sales</span>
                    </h2>
                  </div>
                  <div className="category-item category-orange">
                    <p className="fs-13 mb-1">Sports</p>
                    <h2 className="d-flex align-items-center">
                      545{" "}
                      <span className="fs-13 fw-normal text-default ms-1">Sales</span>
                    </h2>
                  </div>
                  <div className="category-item category-secondary">
                    <p className="fs-13 mb-1">Lifestyles</p>
                    <h2 className="d-flex align-items-center">
                      456{" "}
                      <span className="fs-13 fw-normal text-default ms-1">Sales</span>
                    </h2>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xxl-4 col-md-12 d-flex">
          <div className="card flex-fill">
            <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div className="d-inline-flex align-items-center">
                <span className="title-icon bg-soft-indigo fs-16 me-2">
                  <i className="ti ti-package" />
                </span>
                <h5 className="card-title mb-0">Order Statistics</h5>
              </div>
            </div>
            <div className="card-body pb-0">
              <div id="heat_chart">
                <HeatmapChart />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
