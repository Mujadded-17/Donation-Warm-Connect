<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Donation Submitted</title>
</head>
<body style="margin:0; padding:0; background:#f8f8f8; font-family:Arial, sans-serif; color:#333;">
    <div style="max-width:600px; margin:30px auto; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #eee;">
        <div style="background:#f26a2e; color:#ffffff; padding:24px; text-align:center;">
            <h1 style="margin:0; font-size:24px;">Thank You for Your Donation</h1>
        </div>

        <div style="padding:24px;">
            <p style="font-size:16px; margin-top:0;">
                Hi {{ $user->name }},
            </p>

            <p style="font-size:15px; line-height:1.7;">
                Thank you for submitting your donation to <strong>WarmConnect</strong>.
                We have received your item successfully.
            </p>

            <div style="background:#fff7f0; border:1px solid #f3d2b8; border-radius:10px; padding:16px; margin:20px 0;">
                <p style="margin:0 0 10px; font-size:15px;">
                    <strong>Item:</strong> {{ $item->title ?? 'Donation Item' }}
                </p>

                <p style="margin:0 0 10px; font-size:15px;">
                    <strong>Pickup Location:</strong> {{ $item->pickup_location ?? 'N/A' }}
                </p>

                <p style="margin:0; font-size:15px;">
                    <strong>Status:</strong>
                    <span style="color:#d97706; font-weight:bold;">Pending Approval</span>
                </p>
            </div>

            <p style="font-size:15px; line-height:1.7;">
                Our team will review your donation shortly. Once it is approved, it will become visible to receivers on the platform.
            </p>

            <p style="font-size:15px; line-height:1.7; margin-bottom:0;">
                Thank you for supporting the community with WarmConnect ❤️
            </p>
        </div>
    </div>
</body>
</html>