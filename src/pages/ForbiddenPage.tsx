import React from 'react';
import { Shield, Home, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="relative mb-8">
          <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500">
            403
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <Shield className="w-24 h-24 text-red-500/20" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-4">访问被拒绝</h2>
        <p className="text-slate-400 mb-8 max-w-md mx-auto">
          您没有权限访问此页面。如果您认为这是错误，请联系系统管理员获取相应的访问权限。
        </p>
        
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            返回上一页
          </button>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
          >
            <Home className="w-5 h-5" />
            返回首页
          </Link>
        </div>
        
        <div className="mt-12 pt-8 border-t border-slate-700/50">
          <p className="text-xs text-slate-500">
            大型垃圾焚烧发电厂智慧运营与环保监管平台
          </p>
          <p className="text-xs text-slate-600 mt-1">
            © 2025 Smart Waste Management System
          </p>
        </div>
      </div>
    </div>
  );
};
