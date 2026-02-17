import type { Config } from "tailwindcss"
import { withUt } from "uploadthing/tw";

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		screens: {
  			xs: '450px',
  			xxs: '400px'
  		},
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
			'input-background': 'hsl(var(--input-background))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				'50': '#f8fafc',
  				'100': '#f1f5f9',
  				'200': '#e2e8f0',
  				'300': '#cbd5e1',
  				'400': '#94a3b8',
  				'500': '#64748b',
  				'600': '#475569',
  				'700': '#334155',
  				'800': '#1e293b',
  				'900': '#101828',
  				'950': '#0f172a',
  				DEFAULT: '#101828',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			tertiary: {
  				'50': '#f8f9fa',
  				'100': '#f1f3f4',
  				'200': '#e3e5e7',
  				'300': '#d1d5db',
  				'400': '#9ca3af',
  				'500': '#6b7280',
  				'600': '#475467',
  				'700': '#374151',
  				'800': '#1f2937',
  				'900': '#111827',
  				'950': '#030712',
  				DEFAULT: '#475467'
  			},
  			quinary: {
  				'50': '#fafafa',
  				'100': '#f4f4f5',
  				'200': '#e4e4e7',
  				'300': '#d4d4d8',
  				'400': '#475467',
  				'500': '#71717a',
  				'600': '#52525b',
  				'700': '#3f3f46',
  				'800': '#27272a',
  				'900': '#18181b',
  				'950': '#09090b'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			primaryBrand: {
  				DEFAULT: '#095859'
  			},
  			secondaryBrand: {
  				'80': '#0B6E6Ecc',
  				DEFAULT: '#0B6E6E'
  			},
  			blueBrand: {
  				'80': '#5c9ac5cc',
  				DEFAULT: '#5c9ac5'
  			},
  			pinkBrand: {
  				'80': '#c68087cc',
  				DEFAULT: '#c68087'
  			},
  			darkBrand: {
  				'80': '#f2df2ecc',
  				DEFAULT: '#f2df2e'
  			},
  			charcoalBrand: {
  				'80': '#4f4f4fcc',
  				DEFAULT: '#4f4f4f'
  			},
  			subtext: {
  				DEFAULT: 'rgba(45, 47, 46, 0.60)'
  			},
  			orangeBrand: {
  				'80': '#DC9932cc',
  				DEFAULT: '#DC9932'
  			},
  			yellowBrand: {
  				'80': '#E3CE5Bcc',
  				DEFAULT: '#E3CE5B'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		},
  		fontFamily: {
  			montserrat: [
  				'Poppins',
  				'sans-serif'
  			],
  			sans: [
  				'Poppins',
  				'sans-serif'
  			],
  			jakarta: [
  				'Plus Jakarta Sans',
  				'sans-serif'
  			],
  			lora: [
  				'Lora',
  				'serif'
  			],
  			poppins: [
  				'Poppins',
  				'sans-serif'
  			],
  			cutive: [
  				'Cutive',
  				'serif'
  			]
  		},
  		fontWeight: {
  			light: '300',
  			normal: '400',
  			medium: '500',
  			semibold: '600',
  			bold: '700'
  		},
  		dropShadow: {
  			big: '0px 4px 4px rgba(0, 0, 0, 0.25)',
  			custom: '0px 4px 2px  rgba(0, 0, 0, 0.25)'
  		}
  	}
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    function({ addUtilities }) {
      const newUtilities = {
        '.pb-safe': {
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        },
        '.mb-safe': {
          marginBottom: 'env(safe-area-inset-bottom, 0px)',
        },
        '.ios-safe-bottom': {
          bottom: 'env(safe-area-inset-bottom, 0px)',
        },
        '.test-size': {
          border: '2px solid red', // default
          '@screen xs': {
            borderColor: 'orange',
          },
          '@screen sm': {
            borderColor: 'yellow',
          },
          '@screen md': {
            borderColor: 'green',
          },
          '@screen lg': {
            borderColor: 'blue',
          },
          '@screen xl': {
            borderColor: 'purple',
          },
          '@screen 2xl': {
            borderColor: 'pink',
          },
        }
      }
      addUtilities(newUtilities)
    }
  ],
  safelist: [
    'break-words',
    'break-all',
    'whitespace-pre-wrap',
    'overflow-wrap-anywhere',
    'pb-safe'
  ]
} satisfies Config

export default withUt({
  ...config
});
