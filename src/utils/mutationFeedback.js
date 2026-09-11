export function isMutation(path, options = {}) {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes((options.method || 'GET').toUpperCase())
    && !path.startsWith('/auth/') && options.feedback !== false;
}

export function mutationFeedback(options, payload) {
  const action = typeof options.body?.get === 'function' ? options.body.get('action') : options.body?.action;
  if (action === 'preview' || payload?.data?.mode === 'preview') return null;
  if (payload?.data?.mode === 'confirmed' && payload.data.errorCount > 0) {
    return { icon: 'warning', title: 'นำเข้าไม่ครบ', text: `สำเร็จ ${payload.data.successCount || 0} รายการ ไม่สำเร็จ ${payload.data.errorCount} รายการ กรุณาตรวจสอบผลการนำเข้า` };
  }
  return { icon: 'success', title: options.method?.toUpperCase() === 'DELETE' ? 'ลบข้อมูลสำเร็จ' : 'บันทึกข้อมูลสำเร็จ', timer: 2000, showConfirmButton: false };
}
