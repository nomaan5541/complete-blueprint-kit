CREATE OR REPLACE FUNCTION public.generate_receipt_number(p_school_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefix text;
  v_counter integer;
BEGIN
  UPDATE schools
  SET receipt_counter = receipt_counter + 1
  WHERE id = p_school_id
  RETURNING receipt_prefix, receipt_counter INTO v_prefix, v_counter;
  
  RETURN v_prefix || '-' || LPAD(v_counter::text, 4, '0');
END;
$$;