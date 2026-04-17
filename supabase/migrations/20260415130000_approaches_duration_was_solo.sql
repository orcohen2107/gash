-- Add duration and was_solo fields to approaches table
-- duration: length of the conversation ('brief' = under 1 min, 'short' = 1-5 min, 'long' = 5+ min)
-- was_solo: whether the person was alone when approached

ALTER TABLE approaches
  ADD COLUMN IF NOT EXISTS duration TEXT CHECK (duration IN ('brief', 'short', 'long')),
  ADD COLUMN IF NOT EXISTS was_solo BOOLEAN;
