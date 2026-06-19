<?php
header('Content-Type: application/json; charset=utf-8');

$configPath = __DIR__ . '/config.php';
if (!file_exists($configPath)) {
  http_response_code(500);
  echo json_encode(['error' => 'Falta api/config.php (copiar desde config.example.php)']);
  exit;
}
$cfg = require $configPath;

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && in_array($origin, $cfg['allowed_origins'] ?? [], true)) {
  header("Access-Control-Allow-Origin: $origin");
  header('Vary: Origin');
}
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

try {
  $pdo = new PDO(
    "mysql:host={$cfg['db_host']};dbname={$cfg['db_name']};charset=utf8mb4",
    $cfg['db_user'],
    $cfg['db_pass'],
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
  );
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['error' => 'Error de DB: ' . $e->getMessage()]);
  exit;
}

function input_json() {
  $raw = file_get_contents('php://input');
  if (!$raw) return [];
  $decoded = json_decode($raw, true);
  return is_array($decoded) ? $decoded : [];
}

// Campos auto-gestionados por MySQL que no deben insertarse manualmente
function filter_db_fields(array $data): array {
  $skip = ['createdAt', 'created_at', 'updated_at'];
  return array_diff_key($data, array_flip($skip));
}
function send($data, $code = 200) {
  http_response_code($code);
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}

$base = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/');
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = '/' . ltrim(substr($uri, strlen($base)), '/');
$parts = array_values(array_filter(explode('/', trim($path, '/'))));
$method = $_SERVER['REQUEST_METHOD'];

if (($parts[0] ?? '') === 'health') {
  send(['status' => 'OK', 'timestamp' => date(DATE_ATOM)]);
}

$resources = [
  'clients' => ['table' => 'clients', 'json_fields' => ['geometry']],
  'products' => ['table' => 'products', 'json_fields' => ['components', 'technicalInfo', 'images']],
  'components' => ['table' => 'components', 'json_fields' => []],
  'budgets' => ['table' => 'budgets', 'json_fields' => ['items']]
];

if (($parts[0] ?? '') === 'sync' && ($parts[1] ?? '') === 'export' && $method === 'GET') {
  $out = [];
  foreach ($resources as $key => $r) {
    $rows = $pdo->query("SELECT * FROM {$r['table']}")->fetchAll();
    foreach ($rows as &$row) {
      foreach ($r['json_fields'] as $jf) {
        if (isset($row[$jf]) && is_string($row[$jf])) $row[$jf] = json_decode($row[$jf], true);
      }
    }
    $out[$key] = $rows;
  }
  send($out);
}

if (($parts[0] ?? '') === 'sync' && ($parts[1] ?? '') === 'import' && $method === 'POST') {
  $payload = input_json();
  foreach ($resources as $key => $r) {
    if (!isset($payload[$key]) || !is_array($payload[$key])) continue;
    foreach ($payload[$key] as $item) {
      $id = $item['id'] ?? null;
      if (!$id) continue;
      $check = $pdo->prepare("SELECT id FROM {$r['table']} WHERE id = ?");
      $check->execute([$id]);
      if ($check->fetch()) {
        $cleanItem = filter_db_fields($item);
        $fields = array_keys($cleanItem);
        $sets = [];
        $vals = [];
        foreach ($fields as $f) {
          if ($f === 'id') continue;
          $sets[] = "$f = ?";
          $v = in_array($f, $r['json_fields'], true) ? json_encode($cleanItem[$f], JSON_UNESCAPED_UNICODE) : $cleanItem[$f];
          $vals[] = $v;
        }
        if ($sets) {
          $vals[] = $id;
          $sql = "UPDATE {$r['table']} SET " . implode(',', $sets) . " WHERE id = ?";
          $pdo->prepare($sql)->execute($vals);
        }
      } else {
        $cleanItem = filter_db_fields($item);
        $fields = array_keys($cleanItem);
        $cols = implode(',', $fields);
        $qs = implode(',', array_fill(0, count($fields), '?'));
        $vals = [];
        foreach ($fields as $f) {
          $vals[] = in_array($f, $r['json_fields'], true) ? json_encode($cleanItem[$f], JSON_UNESCAPED_UNICODE) : $cleanItem[$f];
        }
        $pdo->prepare("INSERT INTO {$r['table']} ($cols) VALUES ($qs)")->execute($vals);
      }
    }
  }
  send(['success' => true]);
}

$resource = $parts[0] ?? '';
if (!isset($resources[$resource])) send(['error' => 'Ruta no encontrada'], 404);

$table = $resources[$resource]['table'];
$jsonFields = $resources[$resource]['json_fields'];
$id = $parts[1] ?? null;

if ($method === 'GET' && !$id) {
  $rows = $pdo->query("SELECT * FROM $table")->fetchAll();
  foreach ($rows as &$row) {
    foreach ($jsonFields as $jf) {
      if (isset($row[$jf]) && is_string($row[$jf])) $row[$jf] = json_decode($row[$jf], true);
    }
  }
  send($rows);
}

if ($method === 'POST' && !$id) {
  $raw = input_json();
  if (empty($raw['id'])) send(['error' => 'id requerido'], 400);
  $data = filter_db_fields($raw);
  $fields = array_keys($data);
  $cols = implode(',', $fields);
  $qs = implode(',', array_fill(0, count($fields), '?'));
  $vals = [];
  foreach ($fields as $f) {
    $vals[] = in_array($f, $jsonFields, true) ? json_encode($data[$f], JSON_UNESCAPED_UNICODE) : $data[$f];
  }
  try {
    $pdo->prepare("INSERT INTO $table ($cols) VALUES ($qs)")->execute($vals);
  } catch (Throwable $e) {
    send(['error' => 'Error al guardar: ' . $e->getMessage()], 500);
  }
  send($raw, 201);
}

if ($method === 'PUT' && $id) {
  $raw = input_json();
  $data = filter_db_fields($raw);
  $fields = array_keys($data);
  $sets = [];
  $vals = [];
  foreach ($fields as $f) {
    if ($f === 'id') continue;
    $sets[] = "$f = ?";
    $vals[] = in_array($f, $jsonFields, true) ? json_encode($data[$f], JSON_UNESCAPED_UNICODE) : $data[$f];
  }
  if (!$sets) send(['error' => 'sin cambios'], 400);
  $vals[] = $id;
  try {
    $pdo->prepare("UPDATE $table SET " . implode(',', $sets) . " WHERE id = ?")->execute($vals);
  } catch (Throwable $e) {
    send(['error' => 'Error al actualizar: ' . $e->getMessage()], 500);
  }
  send(['success' => true]);
}

if ($method === 'DELETE' && $id) {
  $pdo->prepare("DELETE FROM $table WHERE id = ?")->execute([$id]);
  http_response_code(204);
  exit;
}

send(['error' => 'Método no permitido'], 405);

