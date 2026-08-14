import React, { useState } from 'react';
import {
  ShieldAlert,
  UserCheck,
  Building2,
  GraduationCap,
  Sliders,
  FlaskConical,
  FileCode2,
  RotateCcw,
  Sparkles,
  LogOut,
  Menu,
  X,
  User as UserIcon,
} from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  currentUser: User;
  allUsers: User[];
  onSwitchUser: (user: User) => void;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onResetDemoData: () => void;
  onLogout: () => void;
  onToggleChatbot: () => void;
  isChatOpen: boolean;
  reviewRequiredCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  allUsers,
  onSwitchUser,
  currentTab,
  onSelectTab,
  onResetDemoData,
  onLogout,
  onToggleChatbot,
  isChatOpen,
  reviewRequiredCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (tab: string) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-[#2C3E50] border-b border-[#E8E6E1]/20 text-white sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo & Brand Title */}
          <div
            className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer select-none"
            onClick={() =>
              handleNavClick(
                currentUser.role === 'STUDENT' ? 'student' : currentUser.role === 'STAFF' ? 'staff' : 'admin'
              )
            }
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#8A9A5B] flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0">
              <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="font-serif italic text-base sm:text-xl tracking-tight text-[#FDFCF8] truncate">
                  UnivComplaint
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-[#E2725B]/25 text-[#F4BEB3] border border-[#E2725B]/40 flex items-center gap-1 flex-shrink-0">
                  <Sparkles className="w-2.5 h-2.5 hidden xs:inline" /> AI Intel
                </span>
              </div>
              <p className="text-[10px] uppercase tracking-wider text-[#DED9CE]/70 hidden lg:block truncate">
                Urgency Classification & Automated Routing System
              </p>
            </div>
          </div>

          {/* Desktop Navigation Items */}
          <nav className="hidden lg:flex items-center space-x-1">
            <button
              id="nav-student-btn"
              onClick={() => handleNavClick('student')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
                currentTab === 'student'
                  ? 'bg-[#8A9A5B] text-white shadow-sm'
                  : 'text-[#DED9CE] hover:text-white hover:bg-[#3D5266]'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Student Portal
            </button>

            <button
              id="nav-staff-btn"
              onClick={() => handleNavClick('staff')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
                currentTab === 'staff'
                  ? 'bg-[#8A9A5B] text-white shadow-sm'
                  : 'text-[#DED9CE] hover:text-white hover:bg-[#3D5266]'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Staff Desk
            </button>

            <button
              id="nav-admin-btn"
              onClick={() => handleNavClick('admin')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 relative ${
                currentTab === 'admin'
                  ? 'bg-[#8A9A5B] text-white shadow-sm'
                  : 'text-[#DED9CE] hover:text-white hover:bg-[#3D5266]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Admin Center
              {reviewRequiredCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] bg-[#E2725B] text-white font-bold animate-pulse">
                  {reviewRequiredCount}
                </span>
              )}
            </button>

            <button
              id="nav-tests-btn"
              onClick={() => handleNavClick('tests')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
                currentTab === 'tests'
                  ? 'bg-[#5B7235] text-white shadow-sm'
                  : 'text-[#DED9CE] hover:text-white hover:bg-[#3D5266]'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              Tests
            </button>

            <button
              id="nav-patent-btn"
              onClick={() => handleNavClick('patent')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
                currentTab === 'patent'
                  ? 'bg-[#3D5266] text-white shadow-sm border border-[#E8E6E1]/20'
                  : 'text-[#DED9CE] hover:text-white hover:bg-[#3D5266]'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              Specs
            </button>
          </nav>

          {/* Quick User Role Switcher, Reset & Logout */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* Gemini AI Chatbot Trigger Button */}
            <button
              id="btn-nav-gemini-chat"
              onClick={onToggleChatbot}
              title="Open Gemini Grievance & Policy AI Assistant"
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 transition shadow-xs ${
                isChatOpen
                  ? 'bg-[#E2725B] text-white shadow-sm'
                  : 'bg-[#1E2B37] hover:bg-[#3D5266] text-[#FDFCF8] border border-[#E8E6E1]/20'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E2725B]" />
              <span className="hidden sm:inline font-sans">Gemini AI</span>
            </button>

            <button
              id="btn-reset-demo"
              onClick={onResetDemoData}
              title="Reset sample seed database"
              className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-full text-[#DED9CE] hover:text-white hover:bg-[#3D5266] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* User Switcher Dropdown */}
            <div className="relative flex items-center">
              <label htmlFor="user-role-select" className="sr-only">Switch Active User</label>
              <div className="flex items-center bg-[#1E2B37] border border-[#E8E6E1]/20 rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5">
                <UserCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#8A9A5B] mr-1.5 flex-shrink-0" />
                <select
                  id="user-role-select"
                  value={currentUser.id}
                  onChange={(e) => {
                    const found = allUsers.find((u) => u.id === e.target.value);
                    if (found) onSwitchUser(found);
                  }}
                  className="bg-transparent text-[11px] sm:text-xs font-medium text-[#FDFCF8] outline-none cursor-pointer pr-1 max-w-[110px] sm:max-w-[160px] truncate"
                >
                  <optgroup label="Administrators">
                    {allUsers
                      .filter((u) => u.role === 'ADMIN')
                      .map((u) => (
                        <option key={u.id} value={u.id} className="bg-[#2C3E50] text-[#FDFCF8]">
                          {u.name} (Admin)
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Department Staff">
                    {allUsers
                      .filter((u) => u.role === 'STAFF')
                      .map((u) => (
                        <option key={u.id} value={u.id} className="bg-[#2C3E50] text-[#FDFCF8]">
                          {u.name} (Staff)
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Students">
                    {allUsers
                      .filter((u) => u.role === 'STUDENT')
                      .map((u) => (
                        <option key={u.id} value={u.id} className="bg-[#2C3E50] text-[#FDFCF8]">
                          {u.name} (Student)
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>
            </div>

            {/* Logout Action Button */}
            <button
              id="btn-logout"
              onClick={onLogout}
              title="Sign Out / Switch Account"
              className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[#1E2B37] hover:bg-[#3D5266] border border-[#E8E6E1]/20 text-[11px] sm:text-xs font-semibold text-[#DED9CE] hover:text-white flex items-center gap-1.5 transition"
            >
              <LogOut className="w-3.5 h-3.5 text-[#E2725B]" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-[#DED9CE] hover:text-white hover:bg-[#3D5266] transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer / Tabs */}
        {mobileMenuOpen ? (
          <div className="lg:hidden py-3 border-t border-[#E8E6E1]/15 space-y-2 animate-in fade-in">
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => handleNavClick('student')}
                className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  currentTab === 'student' ? 'bg-[#8A9A5B] text-white' : 'bg-[#1E2B37] text-[#DED9CE]'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                Student Portal
              </button>

              <button
                onClick={() => handleNavClick('staff')}
                className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  currentTab === 'staff' ? 'bg-[#8A9A5B] text-white' : 'bg-[#1E2B37] text-[#DED9CE]'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Staff Desk
              </button>

              <button
                onClick={() => handleNavClick('admin')}
                className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                  currentTab === 'admin' ? 'bg-[#8A9A5B] text-white' : 'bg-[#1E2B37] text-[#DED9CE]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4" />
                  Admin Center
                </div>
                {reviewRequiredCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-[#E2725B] text-white font-bold">
                    {reviewRequiredCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleNavClick('tests')}
                className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  currentTab === 'tests' ? 'bg-[#5B7235] text-white' : 'bg-[#1E2B37] text-[#DED9CE]'
                }`}
              >
                <FlaskConical className="w-4 h-4" />
                Test Harness
              </button>
            </div>

            <button
              onClick={() => handleNavClick('patent')}
              className={`w-full p-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 ${
                currentTab === 'patent' ? 'bg-[#3D5266] text-white' : 'bg-[#1E2B37] text-[#DED9CE]'
              }`}
            >
              <FileCode2 className="w-4 h-4" />
              Patent Specifications & Flowcharts
            </button>
          </div>
        ) : (
          /* Mobile horizontal scroll tabs strip when menu is closed */
          <div className="flex lg:hidden overflow-x-auto py-2 space-x-1.5 border-t border-[#E8E6E1]/15 scrollbar-none">
            <button
              onClick={() => handleNavClick('student')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap min-h-[36px] flex items-center gap-1 ${
                currentTab === 'student' ? 'bg-[#8A9A5B] text-white shadow-xs' : 'text-[#DED9CE] bg-[#1E2B37]/50'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" /> Student
            </button>
            <button
              onClick={() => handleNavClick('staff')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap min-h-[36px] flex items-center gap-1 ${
                currentTab === 'staff' ? 'bg-[#8A9A5B] text-white shadow-xs' : 'text-[#DED9CE] bg-[#1E2B37]/50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" /> Staff
            </button>
            <button
              onClick={() => handleNavClick('admin')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap min-h-[36px] flex items-center gap-1 ${
                currentTab === 'admin' ? 'bg-[#8A9A5B] text-white shadow-xs' : 'text-[#DED9CE] bg-[#1E2B37]/50'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" /> Admin {reviewRequiredCount > 0 && `(${reviewRequiredCount})`}
            </button>
            <button
              onClick={() => handleNavClick('tests')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap min-h-[36px] flex items-center gap-1 ${
                currentTab === 'tests' ? 'bg-[#5B7235] text-white shadow-xs' : 'text-[#DED9CE] bg-[#1E2B37]/50'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" /> Tests
            </button>
            <button
              onClick={() => handleNavClick('patent')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap min-h-[36px] flex items-center gap-1 ${
                currentTab === 'patent' ? 'bg-[#3D5266] text-white shadow-xs' : 'text-[#DED9CE] bg-[#1E2B37]/50'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" /> Specs
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

