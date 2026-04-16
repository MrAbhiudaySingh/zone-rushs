
CREATE OR REPLACE FUNCTION public.check_level_up()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  WHILE NEW.xp >= NEW.xp_next LOOP
    NEW.xp := NEW.xp - NEW.xp_next;
    NEW.level := NEW.level + 1;
    NEW.xp_next := CEIL(NEW.xp_next * 1.5);
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_check_level_up
BEFORE UPDATE OF xp ON public.profiles
FOR EACH ROW
WHEN (NEW.xp >= OLD.xp_next)
EXECUTE FUNCTION public.check_level_up();
