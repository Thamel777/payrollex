export interface Employee {
  id: string;
  photo: string;
  name: string;
  department: string;
  designation: string;
  type: "Permanent" | "Contract";
  status: "Active" | "Inactive";
  biostarId: string;
  nic: string;
  dob: string;
  gender: string;
  maritalStatus: string;
  nationality: string;
  joinedDate: string;
  salaryType: string;
  basicSalary: number;
  epfNumber: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  address: string;
  email?: string;
  phone?: string;
}

export interface Shift {
  id: string;
  name: string;
  time: string;
  grace: string;
  break: string;
  status: "Active" | "Inactive";
  color: string;
}

export interface AttendanceRecord {
  empId: string;
  name: string;
  department: string;
  shift: string;
  inTime: string;
  outTime: string;
  status: "Present" | "Late" | "Early Leave" | "Absent" | "Missing Punch";
  workHours: string;
  lateMin?: number;
}

export interface LeaveRequest {
  id: string;
  empName: string;
  department: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  duration: string;
  reason: string;
  status: "Approved" | "Pending" | "Rejected";
  appliedOn: string;
}

export interface OvertimeRequest {
  id: string;
  name: string;
  department: string;
  type: string;
  date: string;
  time: string;
  hours: number;
  rateType: string;
  amount: number;
  status: "Approved" | "Pending" | "Rejected";
}

export const mockEmployees: Employee[] = [
  {
    id: "EMP001",
    photo: "NP",
    name: "Nimal Perera",
    department: "IT Department",
    designation: "Senior Developer",
    type: "Permanent",
    status: "Active",
    biostarId: "1001",
    nic: "199124356789",
    dob: "1991-05-15",
    gender: "Male",
    maritalStatus: "Married",
    nationality: "Sri Lankan",
    joinedDate: "2022-01-10",
    salaryType: "Monthly",
    basicSalary: 150000.00,
    epfNumber: "1234567",
    emergencyContact: {
      name: "Sunil Perera",
      relationship: "Brother",
      phone: "077 123 4567"
    },
    address: "123, Galle Road, Colombo 04, Sri Lanka",
    email: "nimal@kawdoco.com",
    phone: "077 123 4567"
  },
  {
    id: "EMP002",
    photo: "KS",
    name: "Kavindi Silva",
    department: "HR Department",
    designation: "HR Executive",
    type: "Permanent",
    status: "Active",
    biostarId: "1002",
    nic: "199456789123",
    dob: "1994-08-22",
    gender: "Female",
    maritalStatus: "Single",
    nationality: "Sri Lankan",
    joinedDate: "2023-03-01",
    salaryType: "Monthly",
    basicSalary: 120000.00,
    epfNumber: "2345678",
    emergencyContact: {
      name: "Chitra Silva",
      relationship: "Mother",
      phone: "071 987 6543"
    },
    address: "45/A, Kandy Road, Kiribathgoda, Sri Lanka",
    email: "kavindi@kawdoco.com",
    phone: "071 987 6543"
  },
  {
    id: "EMP003",
    photo: "MF",
    name: "Minura Fernando",
    department: "Finance Department",
    designation: "Accountant",
    type: "Permanent",
    status: "Active",
    biostarId: "1003",
    nic: "198912345678",
    dob: "1989-11-05",
    gender: "Male",
    maritalStatus: "Married",
    nationality: "Sri Lankan",
    joinedDate: "2021-06-15",
    salaryType: "Monthly",
    basicSalary: 180000.00,
    epfNumber: "3456789",
    emergencyContact: {
      name: "Renuka Fernando",
      relationship: "Spouse",
      phone: "076 555 1234"
    },
    address: "88, Duplication Road, Colombo 03, Sri Lanka",
    email: "minura@kawdoco.com",
    phone: "076 555 1234"
  },
  {
    id: "EMP004",
    photo: "TD",
    name: "Tharushi De Silva",
    department: "Marketing Department",
    designation: "Marketing Executive",
    type: "Contract",
    status: "Active",
    biostarId: "1004",
    nic: "199678123456",
    dob: "1996-03-18",
    gender: "Female",
    maritalStatus: "Single",
    nationality: "Sri Lankan",
    joinedDate: "2024-01-15",
    salaryType: "Monthly",
    basicSalary: 110000.00,
    epfNumber: "4567890",
    emergencyContact: {
      name: "Ananda De Silva",
      relationship: "Father",
      phone: "077 777 8888"
    },
    address: "12, Negombo Road, Wattala, Sri Lanka",
    email: "tharushi@kawdoco.com",
    phone: "077 777 8888"
  },
  {
    id: "EMP005",
    photo: "KR",
    name: "Kasun Rajapaksa",
    department: "Operations Department",
    designation: "Operations Manager",
    type: "Permanent",
    status: "Active",
    biostarId: "1005",
    nic: "198765432109",
    dob: "1987-12-01",
    gender: "Male",
    maritalStatus: "Married",
    nationality: "Sri Lankan",
    joinedDate: "2020-02-15",
    salaryType: "Monthly",
    basicSalary: 250000.00,
    epfNumber: "5678901",
    emergencyContact: {
      name: "Priyani Rajapaksa",
      relationship: "Spouse",
      phone: "072 111 2222"
    },
    address: "99/1, High Level Road, Maharagama, Sri Lanka",
    email: "kasun@kawdoco.com",
    phone: "072 111 2222"
  },
  {
    id: "EMP006",
    photo: "IM",
    name: "Isuri Madushani",
    department: "IT Department",
    designation: "UI/UX Designer",
    type: "Contract",
    status: "Inactive",
    biostarId: "1006",
    nic: "199732145678",
    dob: "1997-07-25",
    gender: "Female",
    maritalStatus: "Single",
    nationality: "Sri Lankan",
    joinedDate: "2023-09-01",
    salaryType: "Monthly",
    basicSalary: 130000.00,
    epfNumber: "6789012",
    emergencyContact: {
      name: "Kamal Gamage",
      relationship: "Uncle",
      phone: "075 444 8888"
    },
    address: "312, Horana Road, Kesbewa, Sri Lanka",
    email: "isuri@kawdoco.com",
    phone: "075 444 8888"
  },
  {
    id: "EMP007",
    photo: "RB",
    name: "Ravindu Bandara",
    department: "Finance Department",
    designation: "Assistant Accountant",
    type: "Permanent",
    status: "Active",
    biostarId: "1007",
    nic: "199345671239",
    dob: "1993-01-30",
    gender: "Male",
    maritalStatus: "Single",
    nationality: "Sri Lankan",
    joinedDate: "2022-11-01",
    salaryType: "Monthly",
    basicSalary: 95000.00,
    epfNumber: "7890123",
    emergencyContact: {
      name: "M. Bandara",
      relationship: "Father",
      phone: "077 999 1111"
    },
    address: "15, Havelock Road, Colombo 05, Sri Lanka",
    email: "ravindu@kawdoco.com",
    phone: "077 999 1111"
  },
  {
    id: "EMP008",
    photo: "PJ",
    name: "Pavithra Jayasinghe",
    department: "HR Department",
    designation: "HR Assistant",
    type: "Permanent",
    status: "Active",
    biostarId: "1008",
    nic: "199856123478",
    dob: "1998-02-14",
    gender: "Female",
    maritalStatus: "Single",
    nationality: "Sri Lankan",
    joinedDate: "2024-03-01",
    salaryType: "Monthly",
    basicSalary: 85000.00,
    epfNumber: "8901234",
    emergencyContact: {
      name: "G. Jayasinghe",
      relationship: "Mother",
      phone: "078 444 5555"
    },
    address: "24, Parliament Road, Kotte, Sri Lanka",
    email: "pavithra@kawdoco.com",
    phone: "078 444 5555"
  }
];

export const mockShifts: Shift[] = [
  { id: "S001", name: "General Shift", time: "08:30 AM - 05:30 PM", grace: "15m | Break: 1h", break: "1 Hour", status: "Active", color: "bg-green-100 text-green-800 border-green-200" },
  { id: "S002", name: "Night Shift", time: "06:00 PM - 03:00 AM", grace: "15m | Break: 1h", break: "1 Hour", status: "Active", color: "bg-purple-100 text-purple-800 border-purple-200" },
  { id: "S003", name: "Rotating Shift", time: "Rotating Every 2 Days", grace: "Different Time Slots", break: "1 Hour", status: "Active", color: "bg-orange-100 text-orange-800 border-orange-200" },
  { id: "S004", name: "Flexible Shift", time: "Flexible Time", grace: "Grace: 30m | Break: 1h", break: "1 Hour", status: "Active", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { id: "S005", name: "Weekend Shift", time: "09:00 AM - 06:00 PM", grace: "Grace: 15m | Break: 1h", break: "1 Hour", status: "Active", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  { id: "S006", name: "Holiday Shift", time: "08:30 AM - 05:30 PM", grace: "Grace: 15m | Break: 1h", break: "1 Hour", status: "Active", color: "bg-red-100 text-red-800 border-red-200" }
];

export const mockAttendance: AttendanceRecord[] = [
  { empId: "EMP001", name: "Nimal Perera", department: "IT Department", shift: "General Shift", inTime: "08:55 AM", outTime: "05:45 PM", status: "Present", workHours: "8h 50m" },
  { empId: "EMP002", name: "Kavindi Silva", department: "HR Department", shift: "General Shift", inTime: "09:10 AM", outTime: "06:15 PM", status: "Late", workHours: "8h 05m", lateMin: 10 },
  { empId: "EMP003", name: "Minura Fernando", department: "Finance Department", shift: "General Shift", inTime: "08:35 AM", outTime: "05:00 PM", status: "Early Leave", workHours: "7h 25m" },
  { empId: "EMP004", name: "Tharushi De Silva", department: "Marketing Department", shift: "Rotating Shift", inTime: "08:45 AM", outTime: "05:30 PM", status: "Present", workHours: "8h 45m" },
  { empId: "EMP005", name: "Kasun Rajapaksa", department: "Operations Department", shift: "Rotating Shift", inTime: "--:--", outTime: "--:--", status: "Absent", workHours: "0h 00m" },
  { empId: "EMP006", name: "Isuri Madushani", department: "IT Department", shift: "Night Shift", inTime: "07:55 PM", outTime: "04:15 AM", status: "Present", workHours: "8h 20m" },
  { empId: "EMP007", name: "Ravindu Bandara", department: "Finance Department", shift: "General Shift", inTime: "--:--", outTime: "--:--", status: "Missing Punch", workHours: "0h 00m" },
  { empId: "EMP008", name: "Pavithra Jayasinghe", department: "HR Department", shift: "General Shift", inTime: "08:50 AM", outTime: "05:40 PM", status: "Present", workHours: "8h 20m" }
];

export const mockLeaveRequests: LeaveRequest[] = [
  { id: "LV001", empName: "Nimal Perera", department: "IT Department", leaveType: "Annual Leave", fromDate: "2024-05-25", toDate: "2024-05-27", duration: "3 Days", reason: "Family Vacation", status: "Approved", appliedOn: "2024-05-18" },
  { id: "LV002", empName: "Kavindi Silva", department: "HR Department", leaveType: "Medical Leave", fromDate: "2024-05-21", toDate: "2024-05-21", duration: "1 Day", reason: "Doctor Appointment", status: "Pending", appliedOn: "2024-05-19" },
  { id: "LV003", empName: "Minura Fernando", department: "Finance Department", leaveType: "Casual Leave", fromDate: "2024-05-22", toDate: "2024-05-22", duration: "1 Day", reason: "Personal Work", status: "Approved", appliedOn: "2024-05-18" },
  { id: "LV004", empName: "Tharushi De Silva", department: "Marketing Department", leaveType: "No-Pay Leave", fromDate: "2024-05-28", toDate: "2024-05-30", duration: "3 Days", reason: "Personal Reason", status: "Pending", appliedOn: "2024-05-20" },
  { id: "LV005", empName: "Kasun Rajapaksa", department: "Operations Department", leaveType: "Short Leave", fromDate: "2024-05-20", toDate: "2024-05-20", duration: "0.5 Day", reason: "Going Late", status: "Approved", appliedOn: "2024-05-20" },
  { id: "LV006", empName: "Isuri Madushani", department: "IT Department", leaveType: "Maternity Leave", fromDate: "2024-06-01", toDate: "2024-08-29", duration: "90 Days", reason: "Maternity Leave", status: "Pending", appliedOn: "2024-05-20" },
  { id: "LV007", empName: "Ravindu Bandara", department: "Finance Department", leaveType: "Special Leave", fromDate: "2024-05-24", toDate: "2024-05-24", duration: "1 Day", reason: "Religious Event", status: "Rejected", appliedOn: "2024-05-19" }
];

export const mockOvertimeRequests: OvertimeRequest[] = [
  { id: "OT001", name: "Nimal Perera", department: "IT Department", type: "Normal OT", date: "2024-05-18", time: "06:00 PM - 09:00 PM", hours: 3, rateType: "Hourly Rate", amount: 3600, status: "Approved" },
  { id: "OT002", name: "Kavindi Silva", department: "HR Department", type: "Weekend OT", date: "2024-05-19", time: "09:00 AM - 01:00 PM", hours: 4, rateType: "Hourly Rate", amount: 6000, status: "Pending" },
  { id: "OT003", name: "Minura Fernando", department: "Finance Department", type: "Night OT", date: "2024-05-17", time: "10:00 PM - 02:00 AM", hours: 4, rateType: "Hourly Rate", amount: 7200, status: "Approved" },
  { id: "OT004", name: "Tharushi De Silva", department: "Marketing Department", type: "Holiday OT", date: "2024-05-01", time: "08:00 AM - 04:00 PM", hours: 8, rateType: "Hourly Rate", amount: 16000, status: "Approved" },
  { id: "OT005", name: "Kasun Rajapaksa", department: "Operations Department", type: "Normal OT", date: "2024-05-16", time: "06:30 PM - 08:30 PM", hours: 2, rateType: "Fixed Rate", amount: 2000, status: "Rejected" },
  { id: "OT006", name: "Isuri Madushani", department: "IT Department", type: "Weekend OT", date: "2024-05-12", time: "10:00 AM - 06:00 PM", hours: 8, rateType: "Hourly Rate", amount: 12000, status: "Pending" },
  { id: "OT007", name: "Ravindu Bandara", department: "Finance Department", type: "Night OT", date: "2024-05-15", time: "11:00 PM - 03:00 AM", hours: 4, rateType: "Hourly Rate", amount: 7200, status: "Pending" },
  { id: "OT008", name: "Pavithra Jayasinghe", department: "HR Department", type: "Holiday OT", date: "2024-05-01", time: "09:00 AM - 05:00 PM", hours: 8, rateType: "Hourly Rate", amount: 16000, status: "Approved" }
];

export const mockAllowances = [
  { id: 1, name: "Travel Allowance", description: "For official travel expenses", type: "Fixed Amount", frequency: "Monthly", amount: 240000.00, status: "Active" },
  { id: 2, name: "Meal Allowance", description: "Meal expenses allowance", type: "Fixed Amount", frequency: "Monthly", amount: 180000.00, status: "Active" },
  { id: 3, name: "Attendance Allowance", description: "For good attendance", type: "Fixed Amount", frequency: "Monthly", amount: 210000.00, status: "Active" },
  { id: 4, name: "Performance Allowance", description: "Based on performance", type: "Percentage (%)", frequency: "Monthly", amount: 230000.00, status: "Active" },
  { id: 5, name: "Phone Allowance", description: "Mobile/phone expenses", type: "Fixed Amount", frequency: "Monthly", amount: 120000.00, status: "Active" },
  { id: 6, name: "Fuel Allowance", description: "Fuel expenses for vehicle", type: "Fixed Amount", frequency: "Monthly", amount: 140000.00, status: "Active" },
  { id: 7, name: "Special Allowance", description: "Special allowance", type: "Fixed Amount", frequency: "Monthly", amount: 81300.00, status: "Active" }
];

export const mockDeductions = [
  { id: 1, name: "No-Pay Deduction", description: "Deduction for no-pay days", type: "Per Day Amount", frequency: "Monthly", amount: 320000.00, status: "Active" },
  { id: 2, name: "Loan Deduction", description: "Employee loan installment", type: "Fixed Amount", frequency: "Monthly", amount: 850000.00, status: "Active" },
  { id: 3, name: "Salary Advance", description: "Salary advance recovery", type: "Fixed Amount", frequency: "Monthly", amount: 150000.00, status: "Active" },
  { id: 4, name: "Late Deduction", description: "Late arrival deduction", type: "Per Occurrence", frequency: "Monthly", amount: 80000.00, status: "Active" },
  { id: 5, name: "Damage Deduction", description: "For damage/breakage", type: "Fixed Amount", frequency: "Monthly", amount: 150000.00, status: "Active" },
  { id: 6, name: "Welfare Deduction", description: "Welfare fund contribution", type: "Fixed Amount", frequency: "Monthly", amount: 120000.00, status: "Active" },
  { id: 7, name: "Other Deduction", description: "Other custom deduction", type: "Fixed or Variable", frequency: "Monthly", amount: 91730.00, status: "Active" }
];

export const mockUserRoles = [
  { role: "Admin", count: 2, desc: "Full control over the system including settings, users, roles and all modules." },
  { role: "HR Manager", count: 8, desc: "Manage employees, attendance, leave and process payroll." },
  { role: "Accounts Officer", count: 5, desc: "Handle salary processing, allowances, deductions and financial reports." },
  { role: "Department Manager", count: 15, desc: "Approve/reject attendance and leave requests for their department." },
  { role: "Employee", count: 200, desc: "Apply for leave, view attendance, download payslips and personal info." },
  { role: "Management", count: 3, desc: "View dashboards and reports for decision making." }
];
