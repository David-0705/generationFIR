-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.generate_complaint_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN 'RC' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS');
END;
$$;