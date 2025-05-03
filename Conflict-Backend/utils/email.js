await emailjs.send(
    'service_m83037r',
    'template_6gp5wcr',
    {
      email: email, // matches {{email}} in EmailJS
      title: notificationTitle, // matches {{title}}
      type: notificationType, // matches {{type}}
      Description: description, // matches {{Description}}
      fname: selectedLecturer.name // matches {{fname}}, assuming you have this
    }
  );
  