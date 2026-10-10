"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Enforce 5MB limit (5 * 1024 * 1024 bytes)
      if (selectedFile.size > 5242880) {
        setResult("Error: File is too large. Please upload a PDF smaller than 5MB.");
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setResult("");
      setIsCopied(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsLoading(true);
    setResult("");
    setIsCopied(false);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/generate-proposal", {
        method: "POST",
        body: formData,
      });

      const responseText = await response.text();
      let data;

      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Server Crash Response: ${responseText.substring(0, 150)}`);
      }

      if (!response.ok) {
        throw new Error(data.error || "Unknown server error.");
      }

      setResult(data.text);
      
    } catch (error: any) {
      console.error("Upload error:", error);
      setResult("Error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset button text after 2 seconds
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // Native, clean, and 100% reliable PDF print function
  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-50 print:bg-white print:p-0">
      
      {/* UPDATE: Added print:border-0 and print:border-transparent to hide frames perfectly */}
      <Card className="w-full max-w-3xl shadow-lg print:shadow-none print:border-0 print:border-transparent">
        
        {/* HIDDEN IN PDF PRINT (print:hidden) */}
        <CardHeader className="print:hidden">
          <CardTitle className="text-2xl font-bold">RFP Analyzer</CardTitle>
          <CardDescription className="flex flex-col gap-2">
            <span>
              Upload your client's technical PDF document, and let AI generate a professional proposal in seconds.
            </span>
            <span className="text-xs text-slate-500 italic">
              * For optimal performance, the AI analyzes the first 10-15 pages (20,000 characters) of your document to extract core requirements.
            </span>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex flex-col gap-6 print:block print:p-0">
          
          {/* UPLOAD ELEMENTS HIDDEN IN PDF (print:hidden) */}
          <input 
            type="file" 
            accept=".pdf"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-slate-900 file:text-white
              hover:file:bg-slate-800 cursor-pointer
              print:hidden"
          />
          <Button 
            onClick={handleUpload} 
            disabled={!file || isLoading}
            className="w-full text-md h-12 print:hidden"
          >
            {isLoading ? "Analyzing PDF & Writing Proposal..." : (file ? "Analyze PDF & Generate Proposal" : "Please Upload a PDF First")}
          </Button>

          {result && (
            <div className="mt-4 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 print:mt-0 print:block">
              
              {/* ACTION BUTTONS HIDDEN IN PDF (print:hidden) */}
              <div className="flex justify-end gap-3 print:hidden">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {isCopied ? "Copied to Clipboard!" : "Copy Proposal"}
                </Button>
                <Button variant="default" size="sm" onClick={handleDownloadPDF}>
                  Download as PDF
                </Button>
              </div>
              
              {/* MAIN CONTENT AREA TO BE PRINTED */}
              {/* UPDATE: Added print:border-0 and print:border-transparent to the inner container */}
              <div className="bg-white border rounded-lg overflow-y-auto max-h-[600px] shadow-inner print:border-0 print:border-transparent print:shadow-none print:overflow-visible print:max-h-none print:h-auto print:block">
                <div id="proposal-content" className="p-8 prose prose-slate max-w-none print:p-0">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
              </div>

            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}