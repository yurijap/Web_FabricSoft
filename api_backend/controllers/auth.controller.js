const { Webhook } = require('svix');
const { clerkClient } = require('@clerk/clerk-sdk-node');

const User = require('../models/model.user');

exports.webhookRegistro = async (req, res) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  
  if (!WEBHOOK_SECRET) {
    console.error('🚨 Faltan variables de entorno: CLERK_WEBHOOK_SECRET');
    return res.status(500).json({ error: 'Error de configuración de servidor' });
  }

  // Validar cabeceras de Svix
  const headers = {
    "svix-id": req.headers["svix-id"],
    "svix-timestamp": req.headers["svix-timestamp"],
    "svix-signature": req.headers["svix-signature"],
  };

  if (!headers["svix-id"] || !headers["svix-timestamp"] || !headers["svix-signature"]) {
    return res.status(400).json({ error: 'Faltan cabeceras de seguridad Svix' });
  }


  const payload = req.body.toString('utf8');
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt;
  try {
    evt = wh.verify(payload, headers);
  } catch (err) {
    console.error('🚨 Error verificando webhook de Clerk:', err.message);
    return res.status(400).json({ error: 'Firma de webhook inválida' });
  }

  const { id, email_addresses, first_name, last_name, image_url, primary_email_address_id } = evt.data;
  const eventType = evt.type;

  try {
  
    if (eventType === 'user.created') {
      const correo = email_addresses?.find(e => e.id === primary_email_address_id)?.email_address || email_addresses[0]?.email_address;

      if (!correo) return res.status(400).json({ error: 'Usuario sin correo' });

      const usuarioExistente = await User.findOne({ email: correo });
      if (usuarioExistente) {
        return res.status(200).json({ success: true, message: 'Usuario ya existe' });
      }

   
      const nuevoUsuario = new User({
        clerkId: id,
        email: correo,
        firstName: first_name || '',
        lastName: last_name || '',
        photoUrl: image_url || '',
        rol: 'admin', 
        status: 'activo'
      });

      await nuevoUsuario.save();

  
      await clerkClient.users.updateUser(id, {
        publicMetadata: { rol: 'admin' }
      });

      console.log(`✅ Nuevo Admin FABRIC creado en MongoDB: ${correo}`);
    }

    // ------------------------------------------------------------------------
    // EVENTO: ACTUALIZADO
    // ------------------------------------------------------------------------
    if (eventType === 'user.updated') {
      const correo = email_addresses?.find(e => e.id === primary_email_address_id)?.email_address;

      await User.findOneAndUpdate(
        { clerkId: id },
        {
          $set: {
            firstName: first_name || '',
            lastName: last_name || '',
            ...(correo && { email: correo }),
            photoUrl: image_url || ''
          }
        },
        { new: true }
      );

      console.log(`🔄 Perfil FABRIC actualizado: ${id}`);
    }

    // ------------------------------------------------------------------------
    // EVENTO: ELIMINADO
    // ------------------------------------------------------------------------
    if (eventType === 'user.deleted') {
      // Limpieza absoluta y simple. Un solo query.
      await User.findOneAndDelete({ clerkId: id });
      console.log(`🗑️ Acceso revocado y usuario eliminado: ${id}`);
    }

    res.status(200).json({ success: true });

  } catch (error) {
    console.error(`🚨 Error procesando evento ${eventType} en MongoDB:`, error);
    return res.status(500).json({ error: 'Error procesando datos internos' });
  }
};


 exports.validarSesion = async (req, res) => {
  try {
    const userId = req.auth.userId; 
    
    if (!userId) {
      return res.status(401).json({ error: 'Acceso denegado' });
    }

    // Buscar el perfil directivo en MongoDB
    const userDoc = await User.findOne({ clerkId: userId });
    const clerkUser = await clerkClient.users.getUser(userId);

    // Auto-heal: Si por alguna razón el webhook falló y el Admin no está en Mongo, lo crea.
    if (!userDoc) {
      const correo = clerkUser.emailAddresses?.[0]?.emailAddress || '';
      
      const nuevoUsuario = new User({
        clerkId: userId,
        email: correo,
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
        photoUrl: clerkUser.imageUrl || '',
        rol: 'admin',
        status: 'activo'
      });

      await nuevoUsuario.save();

      if (clerkUser.publicMetadata?.rol !== 'admin') {
        await clerkClient.users.updateUser(userId, {
          publicMetadata: { ...clerkUser.publicMetadata, rol: 'admin' }
        });
      }

      return res.status(200).json({
        rol: 'admin',
        status: 'activo'
      });
    }

    // Si existe, asegurar sincronización de rol
    const rolMongo = userDoc.rol || 'admin';

    if (clerkUser.publicMetadata?.rol !== rolMongo) {
      await clerkClient.users.updateUser(userId, {
        publicMetadata: { ...clerkUser.publicMetadata, rol: rolMongo }
      });
    }

    // Respuesta limpia y ligera
    res.status(200).json({
      rol: rolMongo,
      status: userDoc.status
    });

  } catch (error) {
    console.error('🚨 Error de validación interna:', error);
    res.status(500).json({ error: 'Error verificando credenciales FABRIC' });
  }
};