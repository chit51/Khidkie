<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {

    $to = "info@khidkie.com";  // Your email

    $name = $_POST['name'];
    $email = $_POST['email'];
    $phone = $_POST['phone'];
    $who = $_POST['who'];
    $other = $_POST['other_text'];
    $city = $_POST['city'];
    $state = $_POST['state'];
    $message = $_POST['message'];

    $subject = "New Enquiry from Khidkie Website";

    $body = "
    <h2>Enquiry generated from khidkie.com</h2>
    <p><strong>Name:</strong> $name</p>
    <p><strong>Email:</strong> $email</p>
    <p><strong>Phone:</strong> $phone</p>
    <p><strong>Who They Are:</strong> $who</p>
    <p><strong>If Other:</strong> $other</p>
    <p><strong>City:</strong> $city</p>
    <p><strong>State:</strong> $state</p>
    <p><strong>Message:</strong><br>$message</p>
    ";

    $headers  = "From: Khidkie™ Enquiry <info@khidkie.com>\r\n";
    $headers .= "Reply-To: $email\r\n";
    $headers .= "Content-Type: text/html\r\n";

    if (mail($to, $subject, $body, $headers)) {
        echo "<script>alert('Your enquiry has been sent successfully!'); window.location.href='index.html';</script>";
    } else {
        echo "<script>alert('Failed to send message. Try again!'); window.history.back();</script>";
    }
}
?>
