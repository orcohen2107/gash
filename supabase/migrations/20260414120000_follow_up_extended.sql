-- הרחבת סוגי "מה הלאה" לתיעוד גישות (תוויות בעברית באפליקציה)
ALTER TYPE follow_up_type ADD VALUE IF NOT EXISTS 'phone';
ALTER TYPE follow_up_type ADD VALUE IF NOT EXISTS 'instant';
ALTER TYPE follow_up_type ADD VALUE IF NOT EXISTS 'coffee';
ALTER TYPE follow_up_type ADD VALUE IF NOT EXISTS 'kiss';
ALTER TYPE follow_up_type ADD VALUE IF NOT EXISTS 'went_home';
