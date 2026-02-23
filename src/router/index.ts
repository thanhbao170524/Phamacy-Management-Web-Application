import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { UserRole } from "@/types";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "Login",
      component: () => import("@/views/LoginView.vue"),
      meta: { requiresGuest: true },
    },
    {
      path: "/",
      component: () => import("@/layouts/AppLayout.vue"),
      meta: { requiresAuth: true },
      children: [
        {
          path: "",
          name: "Dashboard",
          component: () => import("@/views/DashboardView.vue"),
          meta: {
            allowedRoles: [
              UserRole.ADMIN,
              UserRole.SALES_STAFF,
              UserRole.INVENTORY_STAFF,
            ],
          },
        },
        {
          path: "medicines",
          name: "Medicines",
          component: () => import("@/views/MedicinesView.vue"),
          meta: { allowedRoles: [UserRole.ADMIN, UserRole.INVENTORY_STAFF, UserRole.SALES_STAFF] },
        },
        {
          path: "categories",
          name: "Categories",
          component: () => import("@/views/CategoriesView.vue"),
          meta: { allowedRoles: [UserRole.ADMIN, UserRole.INVENTORY_STAFF] },
        },
        {
          path: "inventory",
          name: "Inventory",
          component: () => import("@/views/InventoryView.vue"),
          meta: { allowedRoles: [UserRole.ADMIN, UserRole.INVENTORY_STAFF] },
        },
        {
          path: "sales",
          name: "Sales",
          component: () => import("@/views/SalesView.vue"),
          meta: { allowedRoles: [UserRole.ADMIN, UserRole.SALES_STAFF] },
        },
        {
          path: "alerts",
          name: "Alerts",
          component: () => import("@/views/AlertsView.vue"),
          meta: {
            allowedRoles: [
              UserRole.ADMIN,
              UserRole.SALES_STAFF,
              UserRole.INVENTORY_STAFF,
            ],
          },
        },
        {
          path: "reports",
          name: "Reports",
          component: () => import("@/views/ReportsView.vue"),
          meta: { allowedRoles: [UserRole.ADMIN] },
        },
        {
          path: "staff",
          name: "Staff",
          component: () => import("@/views/StaffView.vue"),
          meta: { allowedRoles: [UserRole.ADMIN] },
        },
        {
          path: "members",
          name: "Members",
          component: () => import("@/views/MembersView.vue"),
          meta: { allowedRoles: [UserRole.ADMIN, UserRole.SALES_STAFF] },
        },
        {
          path: "settings",
          name: "Settings",
          component: () => import("@/views/SettingsView.vue"),
          meta: { allowedRoles: [UserRole.ADMIN] },
        },
      ],
    },
  ],
});

// Navigation guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  // Check if user needs to be authenticated
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: "Login" });
  }

  // Check if guest only route
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    return next({ name: "Dashboard" });
  }

  // Check role-based access
  if (to.meta.allowedRoles && authStore.user) {
    const allowedRoles = to.meta.allowedRoles as UserRole[];
    if (!allowedRoles.includes(authStore.user.role)) {
      return next({ name: "Dashboard" });
    }
  }

  next();
});

export default router;
