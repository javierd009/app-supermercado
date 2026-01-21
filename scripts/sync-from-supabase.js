#!/usr/bin/env node

/**
 * Sincronización Inicial: Supabase → SQLite
 *
 * Descarga todos los datos de Supabase y los inserta en SQLite local
 * para permitir funcionamiento offline completo
 */

const { app } = require('electron');
const Database = require('better-sqlite3');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Cargar variables de entorno
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Faltan variables de entorno:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

app.whenReady().then(async () => {
  console.log('═══════════════════════════════════════════════════');
  console.log('🔄 SINCRONIZACIÓN INICIAL: Supabase → SQLite');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  try {
    // Conectar a SQLite
    const dbPath = path.join(__dirname, '..', 'sabrosita.db');
    console.log('📂 Base de datos SQLite:', dbPath);
    const db = new Database(dbPath);

    // Conectar a Supabase
    console.log('☁️  Conectando a Supabase...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // =====================================
    // 1. SINCRONIZAR USUARIOS
    // =====================================
    console.log('');
    console.log('👥 Sincronizando usuarios...');

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at');

    if (usersError) {
      console.error('❌ Error descargando usuarios:', usersError.message);
    } else {
      const insertUser = db.prepare(`
        INSERT OR REPLACE INTO users (id, username, password_hash, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const transaction = db.transaction((users) => {
        for (const user of users) {
          insertUser.run(
            user.id,
            user.username,
            user.password_hash,
            user.role,
            user.created_at,
            user.updated_at
          );
        }
      });

      transaction(users);
      console.log(`✅ ${users.length} usuarios sincronizados:`);
      users.forEach(u => console.log(`   - ${u.username} (${u.role})`));
    }

    // =====================================
    // 2. SINCRONIZAR PRODUCTOS
    // =====================================
    console.log('');
    console.log('📦 Sincronizando productos...');

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .order('created_at');

    if (productsError) {
      console.error('❌ Error descargando productos:', productsError.message);
    } else {
      const insertProduct = db.prepare(`
        INSERT OR REPLACE INTO products (
          id, code, name, category, cost, price, stock, min_stock,
          tax_rate, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const transaction = db.transaction((products) => {
        for (const product of products) {
          insertProduct.run(
            product.id,
            product.code,
            product.name,
            product.category,
            product.cost,
            product.price,
            product.stock || 0,
            product.min_stock || 10,
            product.tax_rate || 13.00,
            product.created_at,
            product.updated_at
          );
        }
      });

      transaction(products);
      console.log(`✅ ${products.length} productos sincronizados:`);
      products.forEach(p => console.log(`   - ${p.code}: ${p.name} (Stock: ${p.stock})`));
    }

    // =====================================
    // 3. SINCRONIZAR CLIENTES
    // =====================================
    console.log('');
    console.log('👤 Sincronizando clientes...');

    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .order('created_at');

    if (customersError) {
      console.error('❌ Error descargando clientes:', customersError.message);
    } else {
      // NOTA: SQLite solo tiene: id, name, phone, email, address, created_at, updated_at
      // Supabase tiene además: tax_id, is_generic (no sincronizar)
      const insertCustomer = db.prepare(`
        INSERT OR REPLACE INTO customers (
          id, name, phone, email, address, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const transaction = db.transaction((customers) => {
        for (const customer of customers) {
          insertCustomer.run(
            customer.id,
            customer.name,
            customer.phone || '',
            customer.email || '',
            customer.address || '',
            customer.created_at,
            customer.updated_at
          );
        }
      });

      transaction(customers);
      console.log(`✅ ${customers.length} clientes sincronizados:`);
      customers.forEach(c => console.log(`   - ${c.name}`));
    }

    // =====================================
    // 4. SINCRONIZAR CONFIGURACIÓN
    // =====================================
    console.log('');
    console.log('⚙️  Sincronizando configuración...');

    const { data: config, error: configError } = await supabase
      .from('config')
      .select('*');

    if (configError) {
      console.error('❌ Error descargando configuración:', configError.message);
    } else {
      // NOTA: SQLite usa "key" como PRIMARY KEY (no tiene columna "id")
      const insertConfig = db.prepare(`
        INSERT OR REPLACE INTO config (key, value)
        VALUES (?, ?)
      `);

      const transaction = db.transaction((configs) => {
        for (const cfg of configs) {
          insertConfig.run(cfg.key, cfg.value || '');
        }
      });

      transaction(config);
      console.log(`✅ ${config.length} configuraciones sincronizadas:`);
      config.forEach(c => console.log(`   - ${c.key}: ${c.value}`));
    }

    // =====================================
    // 5. SINCRONIZAR CAJAS (cash_registers)
    // =====================================
    console.log('');
    console.log('💵 Sincronizando cajas...');

    const { data: cashRegisters, error: cashRegistersError } = await supabase
      .from('cash_registers')
      .select('*')
      .order('opened_at', { ascending: false });

    if (cashRegistersError) {
      console.error('❌ Error descargando cajas:', cashRegistersError.message);
    } else {
      // NOTA: Mapeo de columnas Supabase → SQLite:
      // - initial_amount → opening_balance
      // - final_amount → closing_balance
      // SQLite NO tiene: expected_amount, difference, exchange_rate
      const insertCashRegister = db.prepare(`
        INSERT OR REPLACE INTO cash_registers (
          id, user_id, opened_at, closed_at, opening_balance, closing_balance,
          notes, status, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const transaction = db.transaction((registers) => {
        for (const register of registers) {
          insertCashRegister.run(
            register.id,
            register.user_id,
            register.opened_at,
            register.closed_at,
            register.initial_amount || 0, // Mapear initial_amount → opening_balance
            register.final_amount || null, // Mapear final_amount → closing_balance
            register.notes || '',
            register.status || 'open',
            register.opened_at // usar opened_at como created_at
          );
        }
      });

      transaction(cashRegisters);
      console.log(`✅ ${cashRegisters.length} cajas sincronizadas`);
    }

    // =====================================
    // 6. SINCRONIZAR VENTAS
    // =====================================
    console.log('');
    console.log('💰 Sincronizando ventas...');

    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false });

    if (salesError) {
      console.error('❌ Error descargando ventas:', salesError.message);
    } else {
      // NOTA: SQLite NO tiene: synced_at, canceled_at, canceled_by, cancel_reason
      // Solo sincronizar columnas que existen en SQLite
      const insertSale = db.prepare(`
        INSERT OR REPLACE INTO sales (
          id, cash_register_id, user_id, customer_id, subtotal, total_tax, total,
          payment_method, amount_received, change_given, payment_currency,
          amount_received_usd, exchange_rate_used, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const transaction = db.transaction((sales) => {
        for (const sale of sales) {
          insertSale.run(
            sale.id,
            sale.cash_register_id,
            sale.user_id,
            sale.customer_id,
            sale.subtotal || 0,
            sale.total_tax || 0,
            sale.total,
            sale.payment_method,
            sale.amount_received,
            sale.change_given,
            sale.payment_currency || 'CRC',
            sale.amount_received_usd,
            sale.exchange_rate_used,
            sale.created_at
          );
        }
      });

      transaction(sales);
      console.log(`✅ ${sales.length} ventas sincronizadas`);
    }

    // =====================================
    // 7. SINCRONIZAR ITEMS DE VENTAS
    // =====================================
    console.log('');
    console.log('🛒 Sincronizando items de ventas...');

    const { data: saleItems, error: saleItemsError } = await supabase
      .from('sale_items')
      .select('*');

    if (saleItemsError) {
      console.error('❌ Error descargando items de ventas:', saleItemsError.message);
    } else {
      const insertSaleItem = db.prepare(`
        INSERT OR REPLACE INTO sale_items (
          id, sale_id, product_id, quantity, unit_price, subtotal,
          tax_rate, tax_amount, subtotal_before_tax
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const transaction = db.transaction((items) => {
        for (const item of items) {
          insertSaleItem.run(
            item.id,
            item.sale_id,
            item.product_id,
            item.quantity,
            item.unit_price,
            item.subtotal,
            item.tax_rate || 13.00,
            item.tax_amount || 0,
            item.subtotal_before_tax
          );
        }
      });

      transaction(saleItems);
      console.log(`✅ ${saleItems.length} items de ventas sincronizados`);
    }

    // =====================================
    // RESUMEN
    // =====================================
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ SINCRONIZACIÓN COMPLETADA');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log('📊 Resumen:');

    const summary = [
      { table: 'users', count: db.prepare('SELECT COUNT(*) as count FROM users').get().count },
      { table: 'products', count: db.prepare('SELECT COUNT(*) as count FROM products').get().count },
      { table: 'customers', count: db.prepare('SELECT COUNT(*) as count FROM customers').get().count },
      { table: 'config', count: db.prepare('SELECT COUNT(*) as count FROM config').get().count },
      { table: 'cash_registers', count: db.prepare('SELECT COUNT(*) as count FROM cash_registers').get().count },
      { table: 'sales', count: db.prepare('SELECT COUNT(*) as count FROM sales').get().count },
      { table: 'sale_items', count: db.prepare('SELECT COUNT(*) as count FROM sale_items').get().count },
    ];

    summary.forEach(s => {
      console.log(`   ${s.table}: ${s.count} registros`);
    });

    console.log('');
    console.log('💡 Ahora puedes:');
    console.log('   1. Hacer login con cualquier usuario de Supabase');
    console.log('   2. Ver el inventario completo offline');
    console.log('   3. Trabajar completamente sin conexión');
    console.log('');

    db.close();
    app.quit();

  } catch (error) {
    console.error('');
    console.error('═══════════════════════════════════════════════════');
    console.error('❌ ERROR EN SINCRONIZACIÓN');
    console.error('═══════════════════════════════════════════════════');
    console.error(error);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  app.quit();
});
