function isStrongPassword(password) {
  return typeof password === 'string'
    && password.length >= 10
    && /[A-Z]/.test(password)
    && /\d/.test(password)
    && /[^A-Za-z0-9]/.test(password);
}

export function validateAdminForm(form, options = {}) {
  const requireUsername = options.requireUsername !== false;
  const requirePassword = options.requirePassword !== false;
  if (requireUsername && (!form.username || form.username.trim().length < 3)) return 'Username ต้องมีอย่างน้อย 3 ตัวอักษร';
  if ((requirePassword || form.password) && !isStrongPassword(form.password)) return 'Password ต้องมีอย่างน้อย 10 ตัวอักษร และมีตัวพิมพ์ใหญ่ ตัวเลข และอักขระพิเศษ';
  if (!form.name || !form.name.trim()) return 'กรุณากรอกชื่อ';
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(form.email).trim())) return 'อีเมลไม่ถูกต้อง';
  return '';
}
