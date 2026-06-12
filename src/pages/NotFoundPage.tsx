import React from 'react';
import { Home, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="relative mb-8">
          <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-emerald-500">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <AlertTriangle className="w-24 h-24 text-amber-500/20" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-4">页面未找到</h2>
        <p className="text-slate-400 mb-8 max-w-md mx-auto">
          您访问的页面不存在或已被移除，请检查URL是否正确，或返回首页继续操作。
        </p>
        
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
        >
          <Home className="w-5 h-5" />
          返回首页
        </Link>
        
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
