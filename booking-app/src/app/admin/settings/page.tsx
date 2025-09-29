'use client';

import { useState } from 'react';
import { useSettingsStore } from '@/store/settings-store';
import { ModernCard } from '@/components/ui/modern-card';
import { ModernButton } from '@/components/ui/modern-button';
import {
  Settings,
  Save,
  RotateCcw,
  Percent,
  Building,
  Briefcase,
  Plane,
  Bell,
  Cog,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Calendar,
  Shield,
  Mail
} from 'lucide-react';

interface SettingsSection {
  id: string;
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description: string;
  expanded: boolean;
}

export default function AdminSettingsPage() {
  const { settings, updateSettings, resetToDefaults, isValidCommissionRate } = useSettingsStore();
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [sections, setSections] = useState<SettingsSection[]>([
    { id: 'commission', title: 'Commission Settings', icon: Percent, description: 'Configure commission rates and rules', expanded: true },
    { id: 'company', title: 'Company Information', icon: Building, description: 'Business details and contact information', expanded: false },
    { id: 'business', title: 'Business Rules', icon: Briefcase, description: 'Payment terms and operational settings', expanded: false },
    { id: 'travel', title: 'Travel Operations', icon: Plane, description: 'Travel-specific settings and requirements', expanded: false },
    { id: 'notifications', title: 'Notifications', icon: Bell, description: 'Email, SMS and communication preferences', expanded: false },
    { id: 'system', title: 'System Settings', icon: Cog, description: 'System preferences and maintenance', expanded: false },
  ]);

  const handleInputChange = (key: keyof typeof settings, value: string | number | boolean) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    setHasChanges(JSON.stringify(newSettings) !== JSON.stringify(settings));
  };

  const toggleSection = (sectionId: string) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? { ...section, expanded: !section.expanded }
        : section
    ));
  };

  const handleSave = () => {
    // Validate commission rates
    const commissionRates = [
      localSettings.defaultCommissionRate,
      localSettings.flightCommissionRate,
      localSettings.hotelCommissionRate,
      localSettings.activityCommissionRate,
      localSettings.transferCommissionRate
    ];

    for (const rate of commissionRates) {
      if (!isValidCommissionRate(rate)) {
        alert(`All commission rates must be between ${localSettings.minCommissionRate}% and ${localSettings.maxCommissionRate}%`);
        return;
      }
    }

    if (localSettings.minCommissionRate >= localSettings.maxCommissionRate) {
      alert('Minimum commission rate must be less than maximum commission rate');
      return;
    }

    if (localSettings.defaultPaymentTerms <= 0) {
      alert('Payment terms must be greater than 0 days');
      return;
    }

    updateSettings(localSettings);
    setHasChanges(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      resetToDefaults();
      setLocalSettings(useSettingsStore.getState().settings);
      setHasChanges(false);
    }
  };

  const renderCommissionSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="w-4 h-4 inline mr-1" />
            Global Default Rate (%)
          </label>
          <input
            type="number"
            min="0"
            max="50"
            step="0.1"
            value={localSettings.defaultCommissionRate}
            onChange={(e) => handleInputChange('defaultCommissionRate', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Fallback rate for all items</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Plane className="w-4 h-4 inline mr-1" />
            Flight Commission (%)
          </label>
          <input
            type="number"
            min="0"
            max="50"
            step="0.1"
            value={localSettings.flightCommissionRate}
            onChange={(e) => handleInputChange('flightCommissionRate', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Default rate for flight bookings</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🏨 Hotel Commission (%)
          </label>
          <input
            type="number"
            min="0"
            max="50"
            step="0.1"
            value={localSettings.hotelCommissionRate}
            onChange={(e) => handleInputChange('hotelCommissionRate', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Default rate for hotel bookings</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🎯 Activity Commission (%)
          </label>
          <input
            type="number"
            min="0"
            max="50"
            step="0.1"
            value={localSettings.activityCommissionRate}
            onChange={(e) => handleInputChange('activityCommissionRate', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Default rate for activity bookings</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🚗 Transfer Commission (%)
          </label>
          <input
            type="number"
            min="0"
            max="50"
            step="0.1"
            value={localSettings.transferCommissionRate}
            onChange={(e) => handleInputChange('transferCommissionRate', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Default rate for transfer bookings</p>
        </div>
      </div>

      <div className="border-t pt-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Commission Bounds</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Commission Rate (%)
            </label>
            <input
              type="number"
              min="0"
              max="50"
              step="0.1"
              value={localSettings.minCommissionRate}
              onChange={(e) => handleInputChange('minCommissionRate', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Commission Rate (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={localSettings.maxCommissionRate}
              onChange={(e) => handleInputChange('maxCommissionRate', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderCompanySettings = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
        <input
          type="text"
          value={localSettings.companyName}
          onChange={(e) => handleInputChange('companyName', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Company Email</label>
        <input
          type="email"
          value={localSettings.companyEmail}
          onChange={(e) => handleInputChange('companyEmail', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Company Phone</label>
        <input
          type="tel"
          value={localSettings.companyPhone}
          onChange={(e) => handleInputChange('companyPhone', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
        <select
          value={localSettings.currency}
          onChange={(e) => handleInputChange('currency', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="USD">USD - US Dollar</option>
          <option value="EUR">EUR - Euro</option>
          <option value="GBP">GBP - British Pound</option>
          <option value="CAD">CAD - Canadian Dollar</option>
          <option value="AUD">AUD - Australian Dollar</option>
        </select>
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">Company Address</label>
        <textarea
          rows={3}
          value={localSettings.companyAddress}
          onChange={(e) => handleInputChange('companyAddress', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );

  const renderBusinessSettings = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Calendar className="w-4 h-4 inline mr-1" />
          Default Payment Terms (days)
        </label>
        <input
          type="number"
          min="1"
          max="365"
          value={localSettings.defaultPaymentTerms}
          onChange={(e) => handleInputChange('defaultPaymentTerms', parseInt(e.target.value) || 30)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">Days customers have to pay invoices</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Auto Quote Expiry (days)
        </label>
        <input
          type="number"
          min="1"
          max="90"
          value={localSettings.autoQuoteExpiry}
          onChange={(e) => handleInputChange('autoQuoteExpiry', parseInt(e.target.value) || 14)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">How long quotes remain valid</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Shield className="w-4 h-4 inline mr-1" />
          Approval Required Above ($)
        </label>
        <input
          type="number"
          min="0"
          step="100"
          value={localSettings.requireApprovalAbove}
          onChange={(e) => handleInputChange('requireApprovalAbove', parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">Bookings above this amount need approval</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Maximum Discount (%)
        </label>
        <input
          type="number"
          min="0"
          max="50"
          step="1"
          value={localSettings.maxDiscountPercent}
          onChange={(e) => handleInputChange('maxDiscountPercent', parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">Maximum discount agents can apply</p>
      </div>
    </div>
  );

  const renderTravelSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Passport Expiry Warning (months)
          </label>
          <input
            type="number"
            min="1"
            max="24"
            value={localSettings.passportExpiryWarning}
            onChange={(e) => handleInputChange('passportExpiryWarning', parseInt(e.target.value) || 6)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Warn when passport expires within this time</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Visa Reminder (days before travel)
          </label>
          <input
            type="number"
            min="1"
            max="180"
            value={localSettings.visaReminderDays}
            onChange={(e) => handleInputChange('visaReminderDays', parseInt(e.target.value) || 30)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Days before travel to remind about visa</p>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900">Default Requirements</h4>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localSettings.defaultTravelInsurance}
              onChange={(e) => handleInputChange('defaultTravelInsurance', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Default Travel Insurance Required</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localSettings.emergencyContactRequired}
              onChange={(e) => handleInputChange('emergencyContactRequired', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Emergency Contact Required</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900">Communication Preferences</h4>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localSettings.emailNotifications}
              onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              <Mail className="w-4 h-4 inline mr-1" />
              Email Notifications
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localSettings.smsNotifications}
              onChange={(e) => handleInputChange('smsNotifications', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">SMS Notifications</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localSettings.customerAutoEmails}
              onChange={(e) => handleInputChange('customerAutoEmails', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Automatic Customer Emails</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localSettings.agentDailyDigest}
              onChange={(e) => handleInputChange('agentDailyDigest', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Agent Daily Digest</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
        <select
          value={localSettings.timezone}
          onChange={(e) => handleInputChange('timezone', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="America/New_York">Eastern Time</option>
          <option value="America/Chicago">Central Time</option>
          <option value="America/Denver">Mountain Time</option>
          <option value="America/Los_Angeles">Pacific Time</option>
          <option value="UTC">UTC</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
        <select
          value={localSettings.dateFormat}
          onChange={(e) => handleInputChange('dateFormat', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Backup Frequency</label>
        <select
          value={localSettings.backupFrequency}
          onChange={(e) => handleInputChange('backupFrequency', e.target.value as 'daily' | 'weekly' | 'monthly')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Data Retention (months)</label>
        <input
          type="number"
          min="6"
          max="120"
          value={localSettings.dataRetentionMonths}
          onChange={(e) => handleInputChange('dataRetentionMonths', parseInt(e.target.value) || 24)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Audit Log Level</label>
        <select
          value={localSettings.auditLogLevel}
          onChange={(e) => handleInputChange('auditLogLevel', e.target.value as 'basic' | 'detailed' | 'verbose')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="basic">Basic</option>
          <option value="detailed">Detailed</option>
          <option value="verbose">Verbose</option>
        </select>
      </div>
    </div>
  );

  const getSectionContent = (sectionId: string) => {
    switch (sectionId) {
      case 'commission': return renderCommissionSettings();
      case 'company': return renderCompanySettings();
      case 'business': return renderBusinessSettings();
      case 'travel': return renderTravelSettings();
      case 'notifications': return renderNotificationSettings();
      case 'system': return renderSystemSettings();
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-100 rounded-xl">
          <Settings className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
          <p className="text-gray-600">Configure global application settings</p>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-4">
        {sections.map((section) => {
          const IconComponent = section.icon;
          return (
            <ModernCard key={section.id} className="overflow-hidden">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <IconComponent className="w-6 h-6 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                    <p className="text-sm text-gray-600">{section.description}</p>
                  </div>
                </div>
                {section.expanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {section.expanded && (
                <div className="px-6 pb-6 border-t border-gray-100">
                  <div className="pt-6">
                    {getSectionContent(section.id)}
                  </div>
                </div>
              )}
            </ModernCard>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between sticky bottom-6 bg-white p-4 rounded-lg shadow-lg border">
        <ModernButton
          variant="outline"
          onClick={handleReset}
          className="flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset to Defaults
        </ModernButton>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-green-600 font-medium">Settings saved successfully!</span>
          )}
          <ModernButton
            onClick={handleSave}
            disabled={!hasChanges}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Changes
            {hasChanges && <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">•</span>}
          </ModernButton>
        </div>
      </div>
    </div>
  );
}