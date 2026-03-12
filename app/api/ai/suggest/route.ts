import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { messages, systemPrompt } = await request.json()
    
    console.log("=== AI API Call Started ===")
    console.log("Messages received:", JSON.stringify(messages, null, 2))
    console.log("Messages count:", messages?.length || 0)
    console.log("System prompt length:", systemPrompt?.length || 0)
    
    // Validate messages array
    if (!messages || messages.length === 0) {
      console.error("❌ No messages received")
      return NextResponse.json({ 
        content: "No messages provided" 
      })
    }
    
    // Check last message content
    const lastMessage = messages[messages.length - 1]
    console.log("Last message:", JSON.stringify(lastMessage, null, 2))
    
    if (!lastMessage?.content || lastMessage.content.trim() === '') {
      console.error("❌ Last message has no content")
      return NextResponse.json({ 
        content: "Message content is empty" 
      })
    }
    
    const apiKey = process.env.GROQ_API_KEY
    console.log("GROQ_API_KEY exists:", !!apiKey)
    console.log("GROQ_API_KEY prefix:", apiKey?.slice(0, 8) + "...")
    console.log("GROQ_API_KEY length:", apiKey?.length || 0)
    
    if (!apiKey) {
      console.log("❌ No GROQ_API_KEY found")
      return NextResponse.json({ 
        content: "Missing GROQ_API_KEY in .env.local" 
      })
    }

    console.log("🚀 Making Groq API call...")
    
    // Use short system prompt to avoid empty responses
    const finalSystemPrompt = systemPrompt && systemPrompt.length < 500 
      ? systemPrompt 
      : `You are Debut AI, a football career assistant. 
Help grassroots football players get discovered by scouts. 
Be concise, encouraging, and specific to football. 
Never make up stats. Keep responses under 100 words.`
    
    const requestBody = {
      model: "llama-3.3-70b-versatile",
      messages: [
        { 
          role: "system", 
          content: finalSystemPrompt
        },
        ...messages
      ],
      max_tokens: 1024,
      temperature: 0.7
    }
    
    console.log("📤 Original system prompt length:", systemPrompt?.length || 0)
    console.log("📤 Final system prompt length:", finalSystemPrompt.length)
    console.log("📤 Final system prompt:", finalSystemPrompt)
    console.log("📤 Request body messages:", JSON.stringify(requestBody.messages, null, 2))
    console.log("📤 Request body:", JSON.stringify(requestBody, null, 2))
    
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      }
    )
    
    console.log("📡 Groq response status:", response.status)
    console.log("📡 Groq response headers:", Object.fromEntries(response.headers.entries()))
    
    const data = await response.json()
    console.log("Full Groq response:", JSON.stringify(data))
    
    // Handle different possible response structures
    let content = ""

    if (data.choices && data.choices.length > 0) {
      content = data.choices[0]?.message?.content || 
                data.choices[0]?.text || 
                ""
      console.log("✅ Content extracted from choices:", content?.slice(0, 100) + "...")
    } else if (data.content) {
      content = data.content
      console.log("✅ Content extracted from data.content:", content?.slice(0, 100) + "...")
    } else if (data.error) {
      console.error("❌ Groq API error:", data.error)
      content = `API Error: ${data.error.message || JSON.stringify(data.error)}` 
    } else {
      console.error("❌ Unknown response structure:", JSON.stringify(data))
      content = "Unable to get response. Check server logs."
    }
    
    console.log("📝 Final content length:", content?.length || 0)
    console.log("📝 Final content preview:", content?.slice(0, 100) + "...")
    
    if (!content) {
      console.log("❌ No content extracted from any response structure")
      return NextResponse.json({ 
        content: "No content returned from API" 
      })
    }
    
    console.log("=== AI API Call Success ===")
    return NextResponse.json({ content })
    
  } catch (error) {
    console.error("💥 Groq fetch error:", error)
    console.error("💥 Error stack:", error instanceof Error ? error.stack : 'No stack available')
    return NextResponse.json({ 
      content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    })
  }
}
