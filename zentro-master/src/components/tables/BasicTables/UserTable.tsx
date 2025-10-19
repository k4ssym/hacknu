import { useState, useRef, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { 
  FiSearch, 
  FiChevronUp, 
  FiChevronDown, 
  FiEdit2, 
  FiTrash2,
  FiDownload,
  FiFilter,
  FiPlus,
  FiSave,
  FiX,
  FiCheck,
  FiSliders
} from "react-icons/fi";
import * as XLSX from "xlsx";

interface User {
  id: string;
  user: string;
  position: string;
  office: string;
  age: number;
  startDate: string;
  salary: string;
}

type ColumnKey = keyof Omit<User, 'id'>;
type FilterConfig = {
  [key in ColumnKey]?: {
    active: boolean;
    value: string;
    type: 'text' | 'number' | 'date';
  }
};

export default function UserTable() {
  // Generate unique IDs for users
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Initial mock data with IDs
  const initialUsers: User[] = [
    { id: generateId(), user: "Abram Schleifer", position: "Sales Assistant", office: "Edinburgh", age: 57, startDate: "25 Apr, 2027", salary: "$89,500" },
    { id: generateId(), user: "Charlotte Anderson", position: "Marketing Manager", office: "London", age: 42, startDate: "12 Mar, 2025", salary: "$105,000" },
    { id: generateId(), user: "Ethan Brown", position: "Software Engineer", office: "San Francisco", age: 30, startDate: "01 Jun, 2024", salary: "$120,000" },
    { id: generateId(), user: "Isabella Davis", position: "UI/UX Designer", office: "Austin", age: 29, startDate: "18 Jul, 2025", salary: "$92,000" },
    { id: generateId(), user: "James Wilson", position: "Data Analyst", office: "Chicago", age: 28, startDate: "20 Sep, 2025", salary: "$80,000" },
    { id: generateId(), user: "Liam Moore", position: "DevOps Engineer", office: "Boston", age: 33, startDate: "30 Oct, 2024", salary: "$115,000" },
    { id: generateId(), user: "Mia Garcia", position: "Content Strategist", office: "Denver", age: 27, startDate: "12 Dec, 2027", salary: "$70,000" },
    { id: generateId(), user: "Olivia Johnson", position: "HR Specialist", office: "Los Angeles", age: 40, startDate: "08 Nov, 2026", salary: "$75,000" },
    { id: generateId(), user: "Sophie Martinez", position: "Product Manager", office: "New York", age: 35, startDate: "15 Jun, 2026", salary: "$95,000" },
    { id: generateId(), user: "William Smith", position: "Financial Analyst", office: "Seattle", age: 38, startDate: "03 Feb, 2026", salary: "$88,000" }
  ];

  // State management
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ 
    key: ColumnKey; 
    direction: 'ascending' | 'descending';
    type: 'string' | 'number' | 'date';
  } | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newUser, setNewUser] = useState<Omit<User, 'id'>>({ 
    user: "", 
    position: "", 
    office: "", 
    age: 0, 
    startDate: "", 
    salary: "" 
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    user: { active: false, value: '', type: 'text' },
    position: { active: false, value: '', type: 'text' },
    office: { active: false, value: '', type: 'text' },
    age: { active: false, value: '', type: 'number' },
    startDate: { active: false, value: '', type: 'date' },
    salary: { active: false, value: '', type: 'text' }
  });

  // Filter and sort users
  const filteredUsers = users.filter(user => {
    // Global search
    const matchesSearch = Object.values(user).some(val =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Column filters
    const matchesFilters = Object.entries(filterConfig).every(([key, config]) => {
      if (!config?.active) return true;
      const userValue = String(user[key as ColumnKey]).toLowerCase();
      const filterValue = config.value.toLowerCase();
      return userValue.includes(filterValue);
    });

    return matchesSearch && matchesFilters;
  });

  // Sorting functionality with type-specific comparison
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortConfig) return 0;
    
    const { key, direction, type } = sortConfig;
    let aValue: any = a[key];
    let bValue: any = b[key];

    // Special handling for different data types
    if (key === 'salary') {
      aValue = parseFloat(aValue.replace(/[^0-9.-]+/g,""));
      bValue = parseFloat(bValue.replace(/[^0-9.-]+/g,""));
    } else if (key === 'startDate') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    } else if (type === 'number') {
      aValue = Number(aValue);
      bValue = Number(bValue);
    }

    if (aValue < bValue) {
      return direction === 'ascending' ? -1 : 1;
    }
    if (aValue > bValue) {
      return direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Column types mapping
  const columnTypes: Record<ColumnKey, 'string' | 'number' | 'date'> = {
    user: 'string',
    position: 'string',
    office: 'string',
    age: 'number',
    startDate: 'date',
    salary: 'number'
  };

  // Sort request handler
  const requestSort = (key: ColumnKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig?.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction, type: columnTypes[key] });
    setCurrentPage(1);
  };

  // Toggle filter for a column
  const toggleFilter = (column: ColumnKey) => {
    setFilterConfig(prev => ({
      ...prev,
      [column]: {
        ...prev[column],
        active: !prev[column]?.active,
        value: ''
      }
    }));
  };

  // Update filter value
  const updateFilter = (column: ColumnKey, value: string) => {
    setFilterConfig(prev => ({
      ...prev,
      [column]: {
        ...prev[column],
        value
      }
    }));
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // CRUD Operations
  const handleDelete = (id: string) => {
    setUsers(users.filter(user => user.id !== id));
    if (paginatedUsers.length === 1 && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const startEditing = (user: User) => {
    setEditingId(user.id);
    setEditForm({ ...user });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEditing = () => {
    setUsers(users.map(user => 
      user.id === editingId ? { ...user, ...editForm } : user
    ));
    setEditingId(null);
    setEditForm({});
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof User) => {
    setEditForm({
      ...editForm,
      [field]: e.target.value
    });
  };

  const startAdding = () => {
    setIsAdding(true);
    setNewUser({ 
      user: "", 
      position: "", 
      office: "", 
      age: 0, 
      startDate: "", 
      salary: "" 
    });
  };

  const cancelAdding = () => {
    setIsAdding(false);
  };

  const handleAddChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof Omit<User, 'id'>) => {
    setNewUser({
      ...newUser,
      [field]: e.target.value
    });
  };

  const saveNewUser = () => {
    const userToAdd = {
      ...newUser,
      id: generateId()
    };
    setUsers([userToAdd, ...users]);
    setIsAdding(false);
    setCurrentPage(1);
  };

  // Export to Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(sortedUsers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
    XLSX.writeFile(workbook, "users_data.xlsx");
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* Table Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-5 py-3 border-b border-gray-100 dark:border-white/[0.05]">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-green-500 dark:focus:border-green-500"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg ${
              showFilters || Object.values(filterConfig).some(f => f?.active)
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'
            }`}
          >
            <FiFilter className="text-gray-500 dark:text-gray-400" />
            <span>Filters</span>
            {Object.values(filterConfig).some(f => f?.active) && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-green-600 rounded-full dark:bg-green-700">
                {Object.values(filterConfig).filter(f => f?.active).length}
              </span>
            )}
          </button>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <FiDownload className="text-gray-500 dark:text-gray-400" />
            <span>Export</span>
          </button>
          <button 
            onClick={startAdding}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
          >
            <FiPlus />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Add User Form */}
      {isAdding && (
        <div className="px-5 py-3 border-b border-gray-100 dark:border-white/[0.05] bg-gray-50 dark:bg-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {Object.keys(newUser).map((key) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </label>
                <input
                  type={key === 'age' ? 'number' : 'text'}
                  className="w-full p-2 text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={newUser[key as keyof typeof newUser]}
                  onChange={(e) => handleAddChange(e, key as keyof Omit<User, 'id'>)}
                  placeholder={`Enter ${key}`}
                />
              </div>
            ))}
            <div className="flex items-end gap-2">
              <button
                onClick={saveNewUser}
                className="px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                disabled={!newUser.user || !newUser.position}
              >
                <FiSave />
              </button>
              <button
                onClick={cancelAdding}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
              >
                <FiX />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="px-5 py-3 border-b border-gray-100 dark:border-white/[0.05] bg-gray-50 dark:bg-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {(Object.keys(filterConfig) as ColumnKey[]).map((key) => (
              <div key={key} className="flex flex-col">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <input
                    type="checkbox"
                    checked={filterConfig[key]?.active || false}
                    onChange={() => toggleFilter(key)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </label>
                {filterConfig[key]?.active && (
                  <input
                    type={filterConfig[key]?.type === 'number' ? 'number' : 'text'}
                    className="w-full p-2 text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={filterConfig[key]?.value || ''}
                    onChange={(e) => updateFilter(key, e.target.value)}
                    placeholder={`Filter ${key}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[1024px]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                {(Object.keys(columnTypes) as ColumnKey[]).map((key) => (
                  <TableCell 
                    key={key}
                    isHeader 
                    className={`px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800`}
                    onClick={() => requestSort(key)}
                  >
                    <div className="flex items-center justify-between">
                      <span>
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                        {filterConfig[key]?.active && (
                          <span className="ml-1 text-green-500">*</span>
                        )}
                      </span>
                      <span className="ml-2">
                        {sortConfig?.key === key ? (
                          sortConfig.direction === 'ascending' ? (
                            <FiChevronUp className="inline text-green-500" />
                          ) : (
                            <FiChevronDown className="inline text-green-500" />
                          )
                        ) : (
                          <span className="inline-block opacity-30">
                            <FiChevronUp className="inline" />
                          </span>
                        )}
                      </span>
                    </div>
                  </TableCell>
                ))}
                <TableCell 
                  isHeader 
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Action
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {paginatedUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  {editingId === user.id ? (
                    <>
                      <TableCell className="px-5 py-4 text-start">
                        <input
                          type="text"
                          className="w-full p-1 text-sm border border-gray-300 rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                          value={editForm.user || ''}
                          onChange={(e) => handleEditChange(e, 'user')}
                        />
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <input
                          type="text"
                          className="w-full p-1 text-sm border border-gray-300 rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                          value={editForm.position || ''}
                          onChange={(e) => handleEditChange(e, 'position')}
                        />
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <input
                          type="text"
                          className="w-full p-1 text-sm border border-gray-300 rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                          value={editForm.office || ''}
                          onChange={(e) => handleEditChange(e, 'office')}
                        />
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <input
                          type="number"
                          className="w-full p-1 text-sm border border-gray-300 rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                          value={editForm.age || ''}
                          onChange={(e) => handleEditChange(e, 'age')}
                        />
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <input
                          type="text"
                          className="w-full p-1 text-sm border border-gray-300 rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                          value={editForm.startDate || ''}
                          onChange={(e) => handleEditChange(e, 'startDate')}
                        />
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <input
                          type="text"
                          className="w-full p-1 text-sm border border-gray-300 rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                          value={editForm.salary || ''}
                          onChange={(e) => handleEditChange(e, 'salary')}
                        />
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <div className="flex space-x-2">
                          <button
                            onClick={saveEditing}
                            className="text-green-500 hover:text-green-700 dark:hover:text-green-400"
                            title="Save"
                          >
                            <FiSave />
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-400"
                            title="Cancel"
                          >
                            <FiX />
                          </button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="px-5 py-4 text-start">
                        <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {user.user}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {user.position}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {user.office}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {user.age}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {user.startDate}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {user.salary}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => startEditing(user)}
                            className="text-green-500 hover:text-green-700 dark:hover:text-green-400"
                            title="Edit"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-white/[0.05] gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Show</span>
              <div className="relative">
                <select
                  className="appearance-none text-sm border border-gray-300 rounded-md px-3 py-1 pr-8 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  {[5, 10, 25, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">entries</span>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, sortedUsers.length)} of{' '}
              {sortedUsers.length} entries
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Previous
              </button>
              
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = currentPage <= 3 
                    ? i + 1 
                    : currentPage >= totalPages - 2 
                      ? totalPages - 4 + i 
                      : currentPage - 2 + i;
                  
                  if (page < 1 || page > totalPages) return null;
                  
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 text-sm font-medium rounded-md min-w-[40px] ${
                        currentPage === page
                          ? 'bg-green-600 text-white dark:bg-green-700'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <span className="px-2 text-gray-500">...</span>
                )}
                
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    {totalPages}
                  </button>
                )}
              </div>
              
              <div className="sm:hidden text-sm text-gray-600 dark:text-gray-400 px-2">
                Page {currentPage} of {totalPages}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}