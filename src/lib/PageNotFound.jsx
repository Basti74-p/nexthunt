import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { TreePine, ArrowLeft } from "lucide-react";

export default function PageNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F7F8]">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-[#0F2F23] rounded-2xl flex items-center justify-center mx-auto">
          <TreePine className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900">404</h1>
        <p className="text-gray-500">Seite nicht gefunden</p>
        <Link
          to={createPageUrl("Dashboard")}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F2F23] text-white rounded-xl text-sm font-medium hover:bg-[#1a4a36] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Zurück zum Dashboard
        </Link>
      </div>
    </div>
  );
}