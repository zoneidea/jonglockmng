import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const baseOptions = {
  confirmButtonColor: '#020617',
  cancelButtonColor: '#e2e8f0',
  buttonsStyling: true,
  customClass: {
    popup: 'jonglock-swal-popup',
    title: 'jonglock-swal-title',
    htmlContainer: 'jonglock-swal-text',
    confirmButton: 'jonglock-swal-confirm',
    cancelButton: 'jonglock-swal-cancel',
  },
};

export function showAlert({
  title = 'แจ้งเตือน',
  text = '',
  icon = 'info',
  confirmButtonText = 'ตกลง',
  ...options
} = {}) {
  return Swal.fire({
    ...baseOptions,
    title,
    text,
    icon,
    confirmButtonText,
    ...options,
  });
}

export async function showConfirm({
  title = 'ยืนยันการทำรายการ',
  text = '',
  icon = 'warning',
  confirmButtonText = 'ยืนยัน',
  cancelButtonText = 'ยกเลิก',
  ...options
} = {}) {
  const result = await Swal.fire({
    ...baseOptions,
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    ...options,
  });

  return result.isConfirmed;
}

export async function showSelect({
  title = 'เลือกข้อมูล',
  text = '',
  inputOptions = {},
  inputPlaceholder = 'กรุณาเลือก',
  confirmButtonText = 'ยืนยัน',
  cancelButtonText = 'ยกเลิก',
  ...options
} = {}) {
  const result = await Swal.fire({
    ...baseOptions,
    title,
    text,
    input: 'select',
    inputOptions,
    inputPlaceholder,
    inputValidator: (value) => (value ? undefined : 'กรุณาเลือกประเภทสินค้า'),
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    ...options,
  });

  return result.isConfirmed ? result.value : null;
}
