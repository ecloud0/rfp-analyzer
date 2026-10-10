import { NextResponse } from "next/server";
import PDFParser from "pdf2json";
import OpenAI from "openai";

// Initialize OpenAI client. It will automatically load the API key from .env.local
const openai = new OpenAI();

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // STEP 1: PARSE PDF TO TEXT
    const pdfText = await new Promise<string>((resolve, reject) => {
      const pdfParser = new PDFParser(null, 1);
      
      pdfParser.on("pdfParser_dataError", (errData: any) => {
        reject(new Error(errData.parserError));
      });
      
      pdfParser.on("pdfParser_dataReady", () => {
        resolve(pdfParser.getRawTextContent());
      });

      pdfParser.parseBuffer(buffer);
    });

    console.log("SUCCESS! PDF successfully parsed. Character count:", pdfText.length);
    console.log("Sending to AI, please wait...");

    // STEP 2: SEND EXTRACTED TEXT TO OPENAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Fast and cost-effective model
      max_tokens: 1500,
      messages: [
        {
          role: "system",
          content: `You are an expert business proposal writer. 
          The user will provide you with the raw text extracted from a client's RFP (Request for Proposal) document.
          Your task is to analyze the requirements and generate a professional, well-structured business proposal in English.
          Include the following sections: Executive Summary, Scope of Work, Proposed Timeline, and Conclusion.
          Format the output in clean, readable plain text or markdown.`
        },
        {
          role: "user",
          content: `Here is the extracted text from the RFP document:\n\n${pdfText.substring(0, 20000)}`
        }
      ],
    });

    // Extract the generated proposal from the API response
    const generatedProposal = completion.choices[0].message.content;
    console.log("SUCCESS! Proposal generated.");

    // STEP 3: RETURN THE RESULT TO THE FRONTEND
    return NextResponse.json({ 
      success: true, 
      text: generatedProposal 
    });

  } catch (error: any) {
    console.error("CRITICAL BACKEND ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process the PDF and generate proposal." },
      { status: 500 }
    );
  }
}