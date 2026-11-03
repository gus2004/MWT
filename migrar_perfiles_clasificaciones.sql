CREATE TEMP TABLE perfiles_importados
(LIKE public.perfiles_pilotos INCLUDING DEFAULTS);

COPY perfiles_importados (id, usuario_id, dorsal_preferido, tipo_sangre, alergias, condiciones_medicas, nombre_contacto_emergencia, parentesco_emergencia, telefono_emergencia, seguro_medico_empresa, poliza_seguro, licencia_federacion) FROM stdin;
pil-01	pil-u-01	7	O+	\N	\N	Ana GarcÃ­a	Esposa	50991001	Seguros Universales	\N	LIC-GT-001
pil-02	pil-u-02	12	A+	\N	\N	Rosa Herrera	Madre	50991002	G&T Seguros	\N	LIC-GT-002
pil-03	pil-u-03	23	B+	\N	\N	Elena MartÃ­nez	Madre	50991003	Seguros Universales	\N	LIC-GT-003
pil-04	pil-u-04	45	AB+	\N	\N	Carmen LÃ³pez	Esposa	50991004	Mapfre Guatemala	\N	LIC-GT-004
pil-05	pil-u-05	3	O-	\N	\N	Patricia Ramos	Madre	50991005	G&T Seguros	\N	LIC-GT-005
pil-06	pil-u-06	18	A-	\N	\N	Jorge PÃ©rez	Hermano	50991006	Seguros Universales	\N	LIC-GT-006
pil-07	pil-u-07	33	O+	\N	\N	Silvia Cruz	Esposa	50991007	Mapfre Guatemala	\N	LIC-GT-007
pil-08	pil-u-08	55	A+	\N	\N	Marco Torres	Padre	50991008	G&T Seguros	\N	LIC-GT-008
pil-09	pil-u-09	9	B-	\N	\N	Patricia VÃ¡squez	Esposa	50991009	Seguros Universales	\N	LIC-GT-009
pil-10	pil-u-10	77	O+	\N	\N	Claudia Ruiz	Hermana	50991010	G&T Seguros	\N	LIC-GT-010
pil-11	pil-u-11	11	A+	\N	\N	Diana Castillo	Madre	50991011	Mapfre Guatemala	\N	LIC-GT-011
pil-12	pil-u-12	27	O+	\N	\N	Luisa Morales	Madre	50991012	Seguros Universales	\N	LIC-GT-012
pil-13	pil-u-13	44	AB-	\N	\N	Marcos JimÃ©nez	Padre	50991013	G&T Seguros	\N	LIC-GT-013
pil-14	pil-u-14	66	B+	\N	\N	Irma MÃ©ndez	Esposa	50991014	Mapfre Guatemala	\N	LIC-GT-014
pil-15	pil-u-15	88	A+	\N	\N	Rebeca Reyes	Madre	50991015	Seguros Universales	\N	LIC-GT-015
pil-16	pil-u-16	22	O-	\N	\N	TomÃ¡s Aguilar	Hermano	50991016	G&T Seguros	\N	LIC-GT-016
pil-17	pil-u-17	32	A-	\N	\N	Gloria RamÃ­rez	Madre	50991017	Mapfre Guatemala	\N	LIC-GT-017
pil-18	pil-u-18	14	O+	\N	\N	Elena GonzÃ¡lez	Esposa	50991018	Seguros Universales	\N	LIC-GT-018
pil-19	pil-u-19	37	B+	\N	\N	Nora RamÃ­rez	Madre	50991019	G&T Seguros	\N	LIC-GT-019
pil-20	pil-u-20	10	A+	\N	\N	JosÃ© ArÃ©valo	Padre	50991020	Mapfre Guatemala	\N	LIC-GT-020
2b319405-4f68-4784-902b-b934bb9a6ec8	5d9b01db-de71-488a-a175-34a316adbfe4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
0594deec-173b-4877-a8b0-d3049ccdc238	bf0fdaf8-ea11-4f38-bdbf-8ba56154831c	4	\N	\N	\N	\N	\N	\N	\N	\N	\N
fa2bca6d-6d7e-439b-afa7-d4b0887c8966	ce4bfd6e-d3c3-4c91-b043-448e71ea4f9a	61	\N	\N	\N	\N	\N	\N	\N	\N	\N
63391a52-f03b-4d88-b507-1ddfb875b804	acd4423a-028f-4643-a9d2-e85028d41c8a	15	\N	\N	\N	\N	\N	\N	\N	\N	\N
150f33b7-e4d5-41b4-855e-fc347ce3e65b	4932b935-1bbd-4bae-8bc1-b29d02fe63ef	11	\N	\N	\N	\N	\N	\N	\N	\N	\N
8c9deeb2-4d54-45b7-8d98-6a5a4186246c	f98c3274-9c2b-479c-90eb-285b20855d2d	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1e0b28f5-451a-4797-9c43-c8a9ec330203	e2661597-9c39-4bc8-a7e5-7928bb0b6e11	77	\N	\N	\N	\N	\N	\N	\N	\N	\N
c56091ca-6eaf-48e6-aa06-796f5ffbd8f0	29bd2f86-00b8-4aef-8b4a-8a21e2092fcd	42	A+	Polen	\N	Maria Piloto	\N	5551234	\N	\N	\N
64d44479-1744-4d18-8330-8d37b0e93b52	188dcded-0eae-48e5-b93b-b085b4313f71	1	AB+	\N	\N	\N	\N	\N	\N	\N	\N
64f057d8-6294-4f8e-8628-63f35d5d829a	181ec4be-9969-4f83-9e9b-096672d2b86f	11	\N	\N	\N	\N	\N	\N	\N	\N	\N
9236a165-b669-4aac-85cf-2da4cc0020c1	25332652-7bdf-4697-a2b0-c1813d002760	17	\N	\N	\N	\N	\N	\N	\N	\N	\N
3fd3fd2b-fcba-4a4b-adc8-2b288fedb364	cc3a6098-e94f-41b3-8dc6-cb82ada812c8	1	O+	Polvo, manÃ­	Ninguna	Luis	\N	+50245454545	\N	\N	4534543543543
82f3c7c5-fd71-4633-8e42-024b0a159e7b	e9f80104-d0a1-4e14-86df-f14e05169de3	12	\N	\N	\N	\N	\N	\N	\N	\N	\N
adcaebdc-330f-4dd6-bee6-6352034a7fe1	7e7393a0-d67c-4c19-bed2-d9fbb25fa4ae	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
ad5a8484-4423-4523-aba5-da970c1aded5	aa3a3fb0-cb7a-457e-a43e-612e3e62b729	16	\N	\N	\N	\N	\N	\N	\N	\N	\N
122b6d56-a969-4605-ba2c-57e4c7ecf7bb	49de7aea-1e5d-44d2-a9ad-677baa3522d1	\N	A+	\N	\N	\N	\N	+502	\N	\N	\N
8a1739f2-9806-42fe-b4ef-a645205b7a8a	99d7c9b4-6be6-4c94-9125-5c5f4ce2eb16	\N	O+	\N	\N	\N	\N	+502	\N	\N	\N
6623e7c0-b367-475b-a4a0-56b03076b8d5	20d6e041-9399-4373-874b-af6922811bf7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1a852242-59f8-4aca-9a38-9d70a761687c	00c5945d-ae51-49bc-a585-0c792b2a45e6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
82f8ae7a-fa73-4b0a-9313-f001a94ae9cf	5c2ed4c6-8769-4699-91bf-bc61150d0f37	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
71333994-3c83-4fe6-b023-cde1eebd086b	85dab1b1-7a2a-4ebd-bb62-adea5b4fbb0b	\N	A+	ninguna.	\N	Maria Jose 45454545	\N	+50256252922	\N	\N	\N
333bc2e5-cced-42b4-a09c-017382cee1b2	f4276a72-1138-49f1-b210-bd46d1484d57	\N	B+	\N	\N	\N	\N	+502	\N	\N	\N
386da8a0-101c-4ccf-ba27-a9d60107a2fa	aafb5462-269d-47a8-8319-dab9c71a9f75	\N	B-	\N	\N	\N	\N	+502	\N	\N	\N
\.


INSERT INTO public.perfiles_pilotos
(id, usuario_id, dorsal_preferido, tipo_sangre, alergias,
 condiciones_medicas, nombre_contacto_emergencia,
 parentesco_emergencia, telefono_emergencia,
 seguro_medico_empresa, poliza_seguro, licencia_federacion)
SELECT
id, usuario_id, dorsal_preferido, tipo_sangre, alergias,
condiciones_medicas, nombre_contacto_emergencia,
parentesco_emergencia, telefono_emergencia,
seguro_medico_empresa, poliza_seguro, licencia_federacion
FROM perfiles_importados
ON CONFLICT DO NOTHING;

CREATE TEMP TABLE clasificaciones_importadas
(LIKE public.clasificaciones_generales INCLUDING DEFAULTS);

COPY clasificaciones_importadas (id, piloto_id, categoria_id, campeonato_id, puntos_total, posicion, actualizado_en) FROM stdin;
ecc5eba8-471a-4aaf-8d02-058b428e9bfb	8a1739f2-9806-42fe-b4ef-a645205b7a8a	a25afd04-daaa-41d6-9074-048dba75fc93	02e6b00c-dd46-44df-bd42-8c38494ab748	0	1	2026-10-29 01:48:09.923
77d8203a-b6b6-4910-a8ea-f22f82667f02	pil-19	a25afd04-daaa-41d6-9074-048dba75fc93	02e6b00c-dd46-44df-bd42-8c38494ab748	0	2	2026-10-29 01:48:10.063
fb71c0d7-6430-4f05-b219-f344bb61faf2	pil-17	a25afd04-daaa-41d6-9074-048dba75fc93	02e6b00c-dd46-44df-bd42-8c38494ab748	0	3	2026-10-29 01:48:10.146
016a622c-e164-44e4-bc1c-02c70c0b12c5	pil-18	a25afd04-daaa-41d6-9074-048dba75fc93	02e6b00c-dd46-44df-bd42-8c38494ab748	0	5	2026-10-29 01:48:10.295
c6930439-c9ae-4458-861d-3022e6ad2ab8	pil-16	a25afd04-daaa-41d6-9074-048dba75fc93	02e6b00c-dd46-44df-bd42-8c38494ab748	0	6	2026-10-29 01:48:10.362
995c6030-42f1-446f-a7fd-6b7a8b64f9ab	64f057d8-6294-4f8e-8628-63f35d5d829a	a25afd04-daaa-41d6-9074-048dba75fc93	02e6b00c-dd46-44df-bd42-8c38494ab748	0	7	2026-10-29 01:48:10.418
97d7edff-f2c2-4bed-8478-e0ea2b9a9179	pil-10	a25afd04-daaa-41d6-9074-048dba75fc93	02e6b00c-dd46-44df-bd42-8c38494ab748	0	1	2026-10-29 01:58:44.162
ff382353-9674-49f0-97a6-7a2144d2eae9	82f8ae7a-fa73-4b0a-9313-f001a94ae9cf	a25afd04-daaa-41d6-9074-048dba75fc93	02e6b00c-dd46-44df-bd42-8c38494ab748	0	2	2026-10-29 01:58:44.237
65515d89-df85-4b15-9942-d847bae4260e	pil-20	a25afd04-daaa-41d6-9074-048dba75fc93	02e6b00c-dd46-44df-bd42-8c38494ab748	0	3	2026-10-29 01:58:44.304
f53dec89-285d-4522-91cb-e21e04d7b93b	0594deec-173b-4877-a8b0-d3049ccdc238	a25afd04-daaa-41d6-9074-048dba75fc93	02e6b00c-dd46-44df-bd42-8c38494ab748	0	4	2026-10-29 01:58:44.367
\.


INSERT INTO public.clasificaciones_generales
(id, piloto_id, categoria_id, campeonato_id,
 puntos_total, posicion, actualizado_en)
SELECT
id, piloto_id, categoria_id, campeonato_id,
puntos_total, posicion, actualizado_en
FROM clasificaciones_importadas
ON CONFLICT DO NOTHING;
