-- Create complaints table for robbery/theft reports
CREATE TABLE public.complaints (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    complaint_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Personal Details
    name TEXT,
    mobile TEXT,
    email TEXT,
    age INTEGER,
    gender TEXT,
    father_name TEXT,
    present_address TEXT,
    district TEXT,
    nearest_police_station_home TEXT,
    
    -- Incident Details
    incident_location TEXT,
    stolen_items TEXT,
    robber_description TEXT,
    nearest_police_station_incident TEXT,
    incident_description TEXT,
    
    -- Status tracking
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'closed'))
);

-- Enable Row Level Security
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Create policies for complaints
CREATE POLICY "Users can view their own complaints" 
ON public.complaints 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own complaints" 
ON public.complaints 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own complaints" 
ON public.complaints 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to generate complaint IDs
CREATE OR REPLACE FUNCTION public.generate_complaint_id()
RETURNS TEXT AS $$
BEGIN
    RETURN 'RC' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS');
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_complaints_updated_at
BEFORE UPDATE ON public.complaints
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();