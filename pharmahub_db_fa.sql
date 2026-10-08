-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 07, 2026 at 04:44 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `pharmahub_db_fa`
--

-- --------------------------------------------------------

--
-- Table structure for table `batches`
--

CREATE TABLE `batches` (
  `batch_id` varchar(20) NOT NULL,
  `medicine_id` varchar(20) DEFAULT NULL,
  `batch_number` varchar(50) DEFAULT NULL,
  `inbound_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `supplier_id` varchar(20) DEFAULT NULL,
  `original_currency` varchar(10) DEFAULT 'MYR',
  `original_price` decimal(10,2) DEFAULT NULL,
  `exchange_rate` decimal(10,4) DEFAULT 1.0000
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `batches`
--

INSERT INTO `batches` (`batch_id`, `medicine_id`, `batch_number`, `inbound_date`, `expiry_date`, `quantity`, `supplier_id`, `original_currency`, `original_price`, `exchange_rate`) VALUES
('BTH-1001', 'MED-1001', 'BN-20260914-01', '2026-09-14', '2028-02-28', 100, NULL, 'MYR', NULL, 1.0000),
('BTH-1002', 'MED-1003', 'BN-20260914-02', '2026-09-14', '2027-12-30', 50, NULL, 'MYR', NULL, 1.0000),
('BTH-1003', 'MED-1002', 'BN-20260914-03', '2026-09-14', '2028-01-15', 90, NULL, 'MYR', NULL, 1.0000),
('BTH-1004', 'MED-1005', 'BN-20260914-04', '2026-09-14', '2027-10-20', 40, NULL, 'MYR', NULL, 1.0000),
('BTH-1005', 'MED-1007', 'BN-20260914-05', '2026-09-14', '2028-02-28', 100, NULL, 'MYR', NULL, 1.0000),
('BTH-1006', 'MED-1006', 'BN-20260914-06', '2026-09-14', '2029-01-31', 100, NULL, 'MYR', NULL, 1.0000),
('BTH-1007', 'MED-1008', 'BN-20260914-07', '2026-09-14', '2028-03-20', 200, NULL, 'MYR', NULL, 1.0000),
('BTH-1008', 'MED-1009', 'BN-20260914-08', '2026-09-14', '2027-09-06', 0, NULL, 'MYR', NULL, 1.0000),
('BTH-1009', 'MED-1009', 'BN-20260914-09', '2026-09-14', '2026-10-31', 20, NULL, 'MYR', NULL, 1.0000),
('BTH-1010', 'MED-1009', 'BN-20260914-10', '2026-09-14', '2027-09-14', 60, NULL, 'MYR', NULL, 1.0000),
('BTH-1012', 'MED-1001', 'BN-20260915-02', '2026-09-15', '2025-10-28', 0, NULL, 'MYR', NULL, 1.0000),
('BTH-1013', 'MED-1014', 'BN-20260917-01', '2026-09-17', '2028-05-17', 5, NULL, 'MYR', NULL, 1.0000),
('BTH-1014', 'MED-1002', 'BN-20261006-01', '2026-10-06', '2026-11-12', 0, 'SUP-002', 'USD', 30.00, 4.0870),
('BTH-1015', 'MED-1008', 'BN-20261007-01', '2026-10-06', '2027-11-05', 40, 'SUP-001', 'MYR', 6.50, 1.0000),
('BTH-1016', 'MED-1002', 'BN-20261007-02', '2026-10-06', '2027-10-12', 5, 'SUP-002', 'USD', 30.00, 4.0870),
('BTH-1017', 'MED-1014', 'BN-20261007-03', '2026-10-06', '2027-10-29', 25, 'SUP-003', 'CNY', 30.00, 0.6095);

-- --------------------------------------------------------

--
-- Table structure for table `deliveries`
--

CREATE TABLE `deliveries` (
  `delivery_id` varchar(20) NOT NULL,
  `txn_id` varchar(20) DEFAULT NULL,
  `customer_name` varchar(100) NOT NULL,
  `customer_phone` varchar(20) DEFAULT NULL,
  `delivery_address` text NOT NULL,
  `delivery_status` varchar(30) DEFAULT 'Pending',
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `deliveries`
--

INSERT INTO `deliveries` (`delivery_id`, `txn_id`, `customer_name`, `customer_phone`, `delivery_address`, `delivery_status`, `created_at`) VALUES
('DLV-1001', 'TSC-1026', 'LIEW YT', '017-4223214', '30, 25150 Kuantan, Pahang, Malaysia', 'Delivered', '2026-10-07 00:24:23'),
('DLV-1002', 'TSC-1027', 'sdfgh', '12345', 'AEON Ipoh Falim, Hala Falim 1, Falim, 30200 Ipoh, Perak, Malaysia', 'Cancelled', '2026-10-07 09:01:46');

-- --------------------------------------------------------

--
-- Table structure for table `medicines`
--

CREATE TABLE `medicines` (
  `medicine_id` varchar(20) NOT NULL,
  `category` varchar(30) DEFAULT NULL,
  `medicine_type` varchar(100) DEFAULT NULL,
  `medicine_name` varchar(50) DEFAULT NULL,
  `dosage_form` varchar(20) DEFAULT NULL,
  `cost_price` decimal(10,2) DEFAULT NULL,
  `selling_price` decimal(10,2) DEFAULT NULL,
  `minStock` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `image_url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `medicines`
--

INSERT INTO `medicines` (`medicine_id`, `category`, `medicine_type`, `medicine_name`, `dosage_form`, `cost_price`, `selling_price`, `minStock`, `is_active`, `image_url`) VALUES
('MED-1001', 'Group C', 'Mild Sleep Aids & Allergy', 'Amoxicillin 500mg', 'Tablet', 10.00, 15.00, 10, 1, '/uploads/med_1789632611326.png'),
('MED-1002', 'Group B', 'Prescription Pain Relief', 'Vobrax 400mg', 'Capsule', 3.50, 5.00, 50, 1, '/uploads/med_1789383293148.png'),
('MED-1003', 'Group B', 'Blood Thinners (Oral Anticoagulants)', 'Eliquis 5mg', 'Tablet', 140.80, 160.00, 50, 1, '/uploads/med_1789384232155.png'),
('MED-1005', 'Group C', 'Decongestants', 'Telfast D', 'Tablet', 5.00, 8.00, 50, 1, '/uploads/med_1789383563550.png'),
('MED-1006', 'Group C', 'Cough & Respiratory Remedies', 'Copastin 10mg', 'Tablet', 1.00, 2.50, 50, 1, '/uploads/med_1789383695435.png'),
('MED-1007', 'Group C', 'Mild Sleep Aids & Allergy', 'Aerius 5mg', 'Tablet', 8.00, 12.00, 50, 1, '/uploads/med_1789384413804.png'),
('MED-1008', 'Group OTC', 'Pain & Fever Relief', 'Panadol ActiFast', 'Tablet', 6.50, 8.55, 50, 1, '/uploads/med_1789383853177.png'),
('MED-1009', 'Group OTC', 'Antacids (Gastrointestinal)', 'Maalox Plus', 'Tablet', 5.00, 8.50, 50, 1, '/uploads/med_1789384013060.png'),
('MED-1014', 'Group B', 'Blood Pressure (Antihypertensives)', 'Amlibon 10mg', 'Tablet', 10.00, 20.00, 100, 1, '/uploads/med_1789632703584.png');

-- --------------------------------------------------------

--
-- Table structure for table `staffs`
--

CREATE TABLE `staffs` (
  `user_id` varchar(20) NOT NULL,
  `username` varchar(50) NOT NULL,
  `user_password` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `staffs`
--

INSERT INTO `staffs` (`user_id`, `username`, `user_password`) VALUES
('U001', 'admin', '$2b$10$Z7dm.95lHrC1hEXgdsxqn.Won1pYBZZxnrImlDdU6xeJfIFJpfWW2'),
('U002', 'staff', '$2b$10$/ma59bB6FBW0jA7/kdp8SuEia7l5Q0bSGIUel7poOmX8.4jLsZBqC');

-- --------------------------------------------------------

--
-- Table structure for table `stock_transaction`
--

CREATE TABLE `stock_transaction` (
  `txn_id` varchar(20) NOT NULL,
  `txn_code` varchar(50) DEFAULT NULL,
  `txn_time` datetime DEFAULT current_timestamp(),
  `batch_id` varchar(20) DEFAULT NULL,
  `medicine_id` varchar(20) DEFAULT NULL,
  `txn_type` varchar(20) DEFAULT NULL,
  `qty_change` int(11) DEFAULT NULL,
  `reason` varchar(200) DEFAULT NULL,
  `user_id` varchar(20) DEFAULT NULL,
  `user_name` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_transaction`
--

INSERT INTO `stock_transaction` (`txn_id`, `txn_code`, `txn_time`, `batch_id`, `medicine_id`, `txn_type`, `qty_change`, `reason`, `user_id`, `user_name`) VALUES
('TSC-1001', 'TXN-20260914-001', '2026-09-14 19:14:04', 'BTH-1001', 'MED-1001', 'Stock In', 100, 'Add Stock', NULL, NULL),
('TSC-1002', 'TXN-20260914-002', '2026-09-14 19:14:26', 'BTH-1002', 'MED-1003', 'Stock In', 80, 'Add Stock', NULL, NULL),
('TSC-1003', 'TXN-20260914-003', '2026-09-14 19:14:41', 'BTH-1003', 'MED-1002', 'Stock In', 100, 'Add Stock', NULL, NULL),
('TSC-1004', 'TXN-20260914-004', '2026-09-14 19:14:57', 'BTH-1004', 'MED-1005', 'Stock In', 60, 'Add Stock', NULL, NULL),
('TSC-1005', 'TXN-20260914-005', '2026-09-14 19:15:10', 'BTH-1005', 'MED-1007', 'Stock In', 100, 'Add Stock', NULL, NULL),
('TSC-1006', 'TXN-20260914-006', '2026-09-14 19:15:25', 'BTH-1006', 'MED-1006', 'Stock In', 100, 'Add Stock', NULL, NULL),
('TSC-1007', 'TXN-20260914-007', '2026-09-14 19:15:41', 'BTH-1007', 'MED-1008', 'Stock In', 200, 'Add Stock', NULL, NULL),
('TSC-1008', 'TXN-20260914-008', '2026-09-14 19:15:59', 'BTH-1008', 'MED-1009', 'Stock In', 100, 'Add Stock', NULL, NULL),
('TSC-1009', 'TXN-20260914-009', '2026-09-14 19:16:44', 'BTH-1008', 'MED-1009', 'Stock Out', -100, 'Prescription Dispense (Selling)', NULL, NULL),
('TSC-1010', 'TXN-20260914-010', '2026-09-14 19:17:28', 'BTH-1009', 'MED-1009', 'Stock In', 20, 'Add Stock', NULL, NULL),
('TSC-1011', 'TXN-20260914-011', '2026-09-14 19:17:45', 'BTH-1010', 'MED-1009', 'Stock In', 60, 'Add Stock', NULL, NULL),
('TSC-1014', 'TXN-20260915-003', '2026-09-15 13:10:32', 'BTH-1012', 'MED-1001', 'Stock In', 20, 'Add Stock', NULL, NULL),
('TSC-1015', 'TXN-20260916-001', '2026-09-16 20:41:05', 'BTH-1004', 'MED-1005', 'Stock Out', -20, 'Prescription', NULL, NULL),
('TSC-1016', 'TXN-20260917-001', '2026-09-17 16:13:39', 'BTH-1013', 'MED-1014', 'Stock In', 10, 'Add Stock', NULL, NULL),
('TSC-1017', 'TXN-20260917-002', '2026-09-17 16:15:27', 'BTH-1013', 'MED-1014', 'Stock Out', -5, 'OTC Retail Sale (Selling)', NULL, NULL),
('TSC-1018', 'TXN-20260917-003', '2026-09-17 16:16:40', 'BTH-1012', 'MED-1001', 'Stock Out', -20, 'Expired Write-off (Loss)', NULL, NULL),
('TSC-1019', 'TXN-20261006-001', '2026-10-06 22:27:56', 'BTH-1014', 'MED-1002', 'Stock In', 10, 'Add Stock', NULL, 'Unknown'),
('TSC-1020', 'TXN-20261006-002', '2026-10-06 22:39:49', 'BTH-1014', 'MED-1002', 'Stock Out', -10, 'Prescription Dispense (Selling)', 'U001', 'admin'),
('TSC-1021', 'TXN-20261006-003', '2026-10-06 22:39:49', 'BTH-1003', 'MED-1002', 'Stock Out', -10, 'Prescription Dispense (Selling)', 'U001', 'admin'),
('TSC-1022', 'TXN-20261007-001', '2026-10-07 00:17:23', 'BTH-1015', 'MED-1008', 'Stock In', 50, 'Add Stock', 'U001', 'admin'),
('TSC-1023', 'TXN-20261007-002', '2026-10-07 00:19:05', 'BTH-1016', 'MED-1002', 'Stock In', 10, 'Add Stock', 'U001', 'admin'),
('TSC-1024', 'TXN-20261007-003', '2026-10-07 00:20:18', 'BTH-1017', 'MED-1014', 'Stock In', 25, 'Add Stock', 'U001', 'admin'),
('TSC-1025', 'TXN-20261007-004', '2026-10-07 00:21:30', 'BTH-1015', 'MED-1008', 'Stock Out', -10, 'OTC Retail Sale (Selling)', 'U001', 'admin'),
('TSC-1026', 'TXN-20261007-005', '2026-10-07 00:24:23', 'BTH-1016', 'MED-1002', 'Stock Out', -5, 'Prescription Dispense (Selling)', 'U002', 'staff'),
('TSC-1027', 'TXN-20261007-006', '2026-10-07 09:01:46', 'BTH-1002', 'MED-1003', 'Stock Out', -30, 'Prescription Dispense (Selling)', 'U001', 'admin');

-- --------------------------------------------------------

--
-- Table structure for table `suppliers`
--

CREATE TABLE `suppliers` (
  `supplier_id` varchar(20) NOT NULL,
  `supplier_name` varchar(100) NOT NULL,
  `country` varchar(50) DEFAULT NULL,
  `currency_code` varchar(10) NOT NULL DEFAULT 'MYR',
  `contact_info` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `suppliers`
--

INSERT INTO `suppliers` (`supplier_id`, `supplier_name`, `country`, `currency_code`, `contact_info`) VALUES
('SUP-001', 'Local Pharma Sdn Bhd', 'Malaysia', 'MYR', 'Kuala Lumpur, Malaysia'),
('SUP-002', 'Global Health US Inc.', 'United States', 'USD', 'New York, USA'),
('SUP-003', 'Sino Med Supplies', 'China', 'CNY', 'Beijing, China');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `batches`
--
ALTER TABLE `batches`
  ADD PRIMARY KEY (`batch_id`),
  ADD KEY `batches_ibfk_1` (`medicine_id`),
  ADD KEY `batches_supplier_fk` (`supplier_id`);

--
-- Indexes for table `deliveries`
--
ALTER TABLE `deliveries`
  ADD PRIMARY KEY (`delivery_id`),
  ADD KEY `fk_delivery_txn` (`txn_id`);

--
-- Indexes for table `medicines`
--
ALTER TABLE `medicines`
  ADD PRIMARY KEY (`medicine_id`);

--
-- Indexes for table `staffs`
--
ALTER TABLE `staffs`
  ADD PRIMARY KEY (`user_id`);

--
-- Indexes for table `stock_transaction`
--
ALTER TABLE `stock_transaction`
  ADD PRIMARY KEY (`txn_id`),
  ADD KEY `batch_id` (`batch_id`),
  ADD KEY `stock_transaction_ibfk_1` (`medicine_id`),
  ADD KEY `stock_transaction_ibfk_3` (`user_id`);

--
-- Indexes for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`supplier_id`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `batches`
--
ALTER TABLE `batches`
  ADD CONSTRAINT `batches_ibfk_1` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`medicine_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `batches_supplier_fk` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`supplier_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `deliveries`
--
ALTER TABLE `deliveries`
  ADD CONSTRAINT `fk_delivery_txn` FOREIGN KEY (`txn_id`) REFERENCES `stock_transaction` (`txn_id`) ON DELETE CASCADE;

--
-- Constraints for table `stock_transaction`
--
ALTER TABLE `stock_transaction`
  ADD CONSTRAINT `stock_transaction_ibfk_1` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`medicine_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `stock_transaction_ibfk_2` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`batch_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `stock_transaction_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `staffs` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
