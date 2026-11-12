-- WeGrow Telecalling CRM - Supabase SQL Schema
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Create LEADS table
CREATE TABLE IF NOT EXISTS public.leads (
    id TEXT PRIMARY KEY,
    student_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    course_interested TEXT,
    lead_source TEXT DEFAULT 'Phone',
    status TEXT DEFAULT 'Interested',
    priority TEXT DEFAULT 'Warm',
    stage TEXT DEFAULT 'Interested',
    assigned_caller TEXT,
    city TEXT DEFAULT 'Tamil Nadu',
    enquiry_date TEXT,
    next_follow_up_date TEXT,
    next_follow_up_time TEXT,
    call_count INTEGER DEFAULT 0,
    qualification TEXT,
    passed_out_year TEXT,
    college_name TEXT,
    last_call_date TEXT,
    last_call_outcome TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for phone number search and assigned staff
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_caller ON public.leads(assigned_caller);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);

-- 2. Create CALLS table
CREATE TABLE IF NOT EXISTS public.calls (
    id TEXT PRIMARY KEY,
    lead_id TEXT REFERENCES public.leads(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    caller_name TEXT NOT NULL,
    call_date TEXT NOT NULL,
    call_time TEXT,
    duration TEXT,
    duration_formatted TEXT,
    duration_seconds INTEGER DEFAULT 0,
    from_time TEXT,
    end_time TEXT,
    outcome TEXT DEFAULT 'Attended Call',
    mindset TEXT DEFAULT 'Interested',
    course_interested TEXT,
    qualification TEXT,
    passed_out_year TEXT,
    college_name TEXT,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for calls
CREATE INDEX IF NOT EXISTS idx_calls_lead_id ON public.calls(lead_id);
CREATE INDEX IF NOT EXISTS idx_calls_phone ON public.calls(phone);
CREATE INDEX IF NOT EXISTS idx_calls_caller_name ON public.calls(caller_name);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON public.calls(created_at DESC);

-- 3. Create FOLLOW_UPS table
CREATE TABLE IF NOT EXISTS public.follow_ups (
    id TEXT PRIMARY KEY,
    lead_id TEXT REFERENCES public.leads(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    caller_name TEXT NOT NULL,
    course TEXT,
    scheduled_date TEXT NOT NULL,
    scheduled_time TEXT,
    status TEXT DEFAULT 'Pending',
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_followups_scheduled_date ON public.follow_ups(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_followups_caller_name ON public.follow_ups(caller_name);

-- 4. Enable Supabase Realtime for instant Web + Mobile updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.calls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.follow_ups;

-- 5. Open Row Level Security policies (Public read/write for telecalling app & web CRM)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-write for leads" ON public.leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for calls" ON public.calls FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for follow_ups" ON public.follow_ups FOR ALL USING (true) WITH CHECK (true);
